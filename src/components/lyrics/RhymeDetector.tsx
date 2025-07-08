export class RhymeDetector {
  private rhymeColors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#FFB3BA','#BAFFC9','#BAE1FF','#FFFFBA'];
  private functionWords = {/* same as before */};
  private commonSuffixes = ['mente','zione','sione','amento','ing','ed','ly'];
  // Update this endpoint if the backend URL changes
  private epitranEndpoint = 'https://rhyme-scribe-song-studio-eumx.onrender.com/stress-tail';
  private ipaCache = new Map<string,string>();

  async detectRhymes(text:string, language:'it'|'en'|'es'|'fr'|'de'='it') {
    const words = this.extractWords(text, language);
    if (words.length<2) return [];
    const enriched = await Promise.all(words.map(w=>this.addStressTail(w,language)));
    const matrix = this.buildSimilarityMatrix(enriched,language);
    const clusters = this.clusterWords(enriched,matrix,language);
    return this.formatGroups(clusters,enriched);
  }

  private extractWords(text:string, language:string) {
    const regex=/\b[A-Za-zÀ-ÖØ-öø-ÿ]{3,}\b/g;
    let index=0; const words=[];
    text.split('\n').forEach((line,lineIdx)=>{
      let m; while((m=regex.exec(line))!==null){
        const w=m[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        if(!this.functionWords[language]?.includes(w) && w.length>=3){
          words.push({word:w,orig:m[0],line:lineIdx,idx:words.filter(x=>x.line===lineIdx).length,start:index+m.index,end:index+m.index+m[0].length});
        }
      }
      index+=line.length+1;
    });
    return words;
  }

  private async addStressTail(w:any,lang:string) {
    const key=`${w.word}-${lang}`;
    let tail=this.ipaCache.get(key);
    if(!tail){
      try{
        const res=await fetch(this.epitranEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word:w.word,language:lang})});
        if(res.ok){
          const j=await res.json();
          tail=j.stress_tail||j.ipa.split('ˈ').pop()||j.ipa.slice(-3);
        }
      }catch{}
      if(!tail) tail=w.word.slice(-3);
      this.ipaCache.set(key,tail);
    }
    return {...w,stressTail:tail};
  }

  private buildSimilarityMatrix(words:any[],lang:string){
    const n=words.length, M=Array(n).fill(0).map(()=>Array(n).fill(0));
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){
      M[i][j]= i===j?1:this.phoneticSim(words[i].stressTail,words[j].stressTail,lang);
    }
    return M;
  }

  private phoneticSim(t1:string,t2:string,lang:string){
    if(t1===t2) return 1;
    if(!t1||!t2||t1.length<2||t2.length<2) return 0;
    const vowels='aeiouáéíóúàèìòùâêîôûäëïöüæøå';
    const v1=[...t1].filter(c=>vowels.includes(c)), v2=[...t2].filter(c=>vowels.includes(c));
    const c1=[...t1].filter(c=>!vowels.includes(c)&&/[A-Za-z]/.test(c)), c2=[...t2].filter(c=>!vowels.includes(c)&&/[A-Za-z]/.test(c));
    const sv=this.seqSim(v1,v2), sc=this.seqSim(c1,c2);
    const vw=['it','es','fr'].includes(lang)?0.85:0.75;
    let score=sv*vw+sc*(1-vw);
    for(const s of this.commonSuffixes) if(t1.endsWith(s)&&t2.endsWith(s)&&t1!==t2) score*=0.3;
    return score;
  }

  private seqSim(a:string[],b:string[]){
    if(!a.length&&!b.length) return 1; if(!a.length||!b.length) return 0;
    let m=0, L=Math.min(a.length,b.length);
    for(let i=1;i<=L;i++){ if(a[a.length-i]===b[b.length-i]) m++; else break; }
    return m/Math.max(a.length,b.length);
  }

  private clusterWords(words:any[],M:number[][],lang:string){
    const n=words.length, parent=Array.from({length:n},(_,i)=>i);
    const find=(x:number):number=> parent[x]===x?x:(parent[x]=find(parent[x]));
    const union=(x,y)=>{const a=find(x),b=find(y);if(a!==b)parent[a]=b;};
    const pt=['it','es','fr'].includes(lang)?0.95:0.90, nt=['it','es','fr'].includes(lang)?0.85:0.80;
    for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){
      const s=M[i][j];
      if(s>=pt&&this.contextOK(words[i],words[j],s)) union(i,j);
      else if(s>=nt&&this.strictOK(words[i],words[j],s)) union(i,j);
    }
    const groups=new Map<number,number[]>();
    for(let i=0;i<n;i++){ const r=find(i); if(!groups.has(r)) groups.set(r,[]); groups.get(r)!.push(i); }
    return Array.from(groups.values()).filter(g=>g.length>=2);
  }

  private contextOK(a:any,b:any,s:number){
    if(this.lev(a.word,b.word)<=1&&a.word.length>3) return false;
    return s>=0.75;
  }
  private strictOK(a:any,b:any,s:number){
    if(!this.contextOK(a,b,s)||a.stressTail.length<2||b.stressTail.length<2) return false;
    if(a.line===b.line&&Math.abs(a.idx-b.idx)<=2) return false;
    return true;
  }

  private lev(a:string,b:string){
    const dp=Array(b.length+1).fill(0).map((_,i)=>i);
    for(let i=0;i<=a.length;i++){
      let prev=dp[0]=i;
      for(let j=1;j<=b.length;j++){
        const cur= b[j-1]===a[i-1]?dp[j-1]:Math.min(dp[j-1],dp[j],prev)+1;
        dp[j-1]=prev; prev=cur;
      }
      dp[b.length]=prev;
    }
    return dp[b.length];
  }

  private formatGroups(clusters:number[][],words:any[]){
    return clusters.map((c,idx)=>{
      let tot=0,cmp=0;
      for(let i=0;i<c.length;i++) for(let j=i+1;j<c.length;j++){
        tot+=this.phoneticSim(words[c[i]].stressTail,words[c[j]].stressTail,'it');
        cmp++;
      }
      const avg=cmp?tot/cmp:0;
      if(avg<0.75) return null;
      return {
        id:`rhyme-${idx}`,
        words:c.map(i=>words[i].word),
        color:this.rhymeColors[idx%this.rhymeColors.length],
        type: avg>=0.95 ? 'perfect' : avg>=0.85 ? 'near' : 'slant',
        strength:avg,
        positions:c.map(i=>({
          line:words[i].line,wordIndex:words[i].idx,
          word:words[i].word,startChar:words[i].start,endChar:words[i].end
        }))
      };
    }).filter(g=>g);
  }
}
