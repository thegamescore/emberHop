// An original bell arrangement of the public-domain Jingle Bells chorus.
// All waveforms are synthesized locally; no recordings or downloaded assets.
const melody: [number,number][] = [
  [76,1],[76,1],[76,2],[76,1],[76,1],[76,2],[76,1],[79,1],[72,1.5],[74,.5],[76,4],
  [77,1],[77,1],[77,1.5],[77,.5],[77,1],[76,1],[76,1],[76,.5],[76,.5],[76,1],[74,1],[74,1],[76,1],[74,2],[79,2],
  [76,1],[76,1],[76,2],[76,1],[76,1],[76,2],[76,1],[79,1],[72,1.5],[74,.5],[76,4],
  [77,1],[77,1],[77,1],[77,1],[77,1],[76,1],[76,1],[76,.5],[76,.5],[79,1],[79,1],[77,1],[74,1],[72,4],
];
export class AudioPlayer {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  muted = false;
  active = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private next = 0;
  private index = 0;
  private beat = 0;
  async unlock() {
    try {
      if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.muted?0:.55;this.master.connect(this.context.destination);}
      if(this.context.state==='suspended')await this.context.resume();
      if(this.active)this.schedule();
    } catch { /* Silent play remains available on browsers without Web Audio. */ }
  }
  setMuted(value:boolean) {
    this.muted=value;
    if(this.context&&this.master)this.master.gain.setTargetAtTime(value?0:.55,this.context.currentTime,.025);
  }
  tone(note:number,when:number,length:number,volume:number,type:OscillatorType='sine') {
    if(!this.context||!this.master)return;
    const osc=this.context.createOscillator(),gain=this.context.createGain();
    osc.type=type;osc.frequency.value=440*2**((note-69)/12);
    gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(volume,when+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,when+length);
    osc.connect(gain);gain.connect(this.master);osc.start(when);osc.stop(when+length+.02);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  private schedule() {
    if(!this.context||!this.active||this.context.state!=='running')return;
    if(this.next<this.context.currentTime)this.next=this.context.currentTime+.025;
    while(this.next<this.context.currentTime+.12){
      const [note,beats]=melody[this.index];
      this.tone(note,this.next,Math.min(beats*.29,.85),.085);
      this.tone(note+19,this.next,.14,.012);
      if(this.beat%4===0)this.tone([48,53,55,48][Math.floor(this.beat/16)%4],this.next,.65,.04,'triangle');
      this.next+=beats*.29;this.beat+=beats;this.index=(this.index+1)%melody.length;
    }
  }
  play() {
    this.active=true;
    if(!this.timer)this.timer=setInterval(()=>this.schedule(),50);
    this.schedule();
  }
  pause() {
    this.active=false;
    if(this.timer){clearInterval(this.timer);this.timer=null;}
    if(this.context?.state==='running')void this.context.suspend().catch(()=>{});
  }
  effect(kind:'boost'|'score'|'end') {
    const now=this.context?.currentTime;
    if(now===undefined||this.context?.state!=='running')return;
    if(kind==='boost'){this.tone(72,now,.09,.09,'triangle');this.tone(79,now+.025,.08,.055);}
    if(kind==='score'){this.tone(84,now,.16,.17);this.tone(88,now+.07,.23,.14);}
    if(kind==='end'){this.tone(55,now,.22,.13,'triangle');this.tone(48,now+.1,.3,.09,'triangle');}
  }
}
