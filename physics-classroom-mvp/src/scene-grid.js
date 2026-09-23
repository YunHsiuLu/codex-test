// A shared spacing keeps the three reference planes comparable and bounds line counts.
export function gridLayout(min, max) {
  const extent=Math.max(20,...['x','y','z'].map(k=>Math.max(0,max[k])-Math.min(0,min[k])));
  const target=extent/30,power=10**Math.floor(Math.log10(Math.max(1,target)));
  const step=[1,2,5,10].map(n=>n*power).find(n=>n>=target) || power*10;
  const lower={},upper={};
  for(const k of ['x','y','z']) {
    lower[k]=Math.floor((Math.min(-10,min[k])-step*2)/step)*step;
    upper[k]=Math.ceil((Math.max(10,max[k])+step*2)/step)*step;
  }
  return {step,lower,upper};
}
