import fs from 'node:fs';
const rules=JSON.parse(fs.readFileSync('database.rules.json'));
const room=rules.rules.rooms.$room;
const auth="auth != null && auth.uid == 'sjOawvV1pKTvH9xcwKfpQg0Vc2C3' && auth.token.firebase.sign_in_provider == 'password'";
const validRoom='$room.matches(/^[A-Z0-9]{4,12}$/)';
room.vectors.$id['.write']=`${auth} && ${validRoom} && $id.matches(/^v([0-9]|[1-4][0-9])$/)`;
delete rules.rules.permissions;
// A virtual read probe is unnecessary: the client gets its authorization from a rules-protected gate.
room.teacherAccess={'.read':`${auth} && ${validRoom}`,'.write':false};
const num=(min,max)=>({'.validate':`newData.isNumber() && newData.val() >= ${min} && newData.val() <= ${max}`});
const point=limit=>({'.validate':"newData.hasChildren(['x','y','z'])",x:num(-limit,limit),y:num(-limit,limit),z:num(-limit,limit),'$other':{'.validate':false}});
room.lab={
 '.read':validRoom,'.write':`${auth} && ${validRoom}`,
 '.validate':"newData.hasChildren(['mode','operation','a','b','particle','clock']) && ((newData.child('mode').val() != 'projectile' && newData.child('mode').val() != 'oscillator') || newData.hasChild('mechanics'))",
 mode:{'.validate':"newData.val() == 'vectors' || newData.val() == 'algebra' || newData.val() == 'lorentz' || newData.val() == 'projectile' || newData.val() == 'oscillator'"},
 operation:{'.validate':"newData.val() == 'add' || newData.val() == 'subtract' || newData.val() == 'cross' || newData.val() == 'projection' || newData.val() == 'angle'"},
 a:{'.validate':"newData.isString() && newData.val().matches(/^v([0-9]|[1-4][0-9])$/)"},
 b:{'.validate':"newData.isString() && newData.val().matches(/^v([0-9]|[1-4][0-9])$/)"},
 particle:{'.validate':"newData.hasChildren(['charge','mass','velocity','electric','field','duration','rate','scale'])",charge:num(-1000,1000),mass:num(1e-35,1e6),velocity:point(1e7),electric:point(1000),field:point(1000),duration:num(1e-12,1e4),rate:num(1e-15,1000),scale:num(1e-9,1e12),'$other':{'.validate':false}},
 clock:{'.validate':"newData.hasChildren(['playing','elapsed','startedAt']) && newData.child('elapsed').val() <= ((newData.parent().child('mode').val() == 'projectile' || newData.parent().child('mode').val() == 'oscillator') ? newData.parent().child('mechanics/duration').val() : newData.parent().child('particle/duration').val())",playing:{'.validate':'newData.isBoolean()'},elapsed:num(0,1e4),startedAt:num(0,1e15),'$other':{'.validate':false}},
 '$other':{'.validate':false}
};
const ranges={height:[0,100],speed:[0,100],angle:[-90,90],gravity:[.01,100],amplitude:[0,100],omega:[.01,100],phase:[-360,360],mass:[.001,1000],duration:[.01,1000],rate:[.001,100],scale:[.001,10]};
room.lab.mechanics={'.validate':`newData.hasChildren(${JSON.stringify(Object.keys(ranges))})`,...Object.fromEntries(Object.entries(ranges).map(([k,[lo,hi]])=>[k,num(lo,hi)])),'$other':{'.validate':false}};
fs.writeFileSync('database.rules.json',JSON.stringify(rules,null,2)+'\n');
