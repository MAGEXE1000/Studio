const fs = require('fs');
const path = require('path');

const authPath = path.join('packages', 'studio-core', 'src', 'repositories', 'AuthRepository.ts');
let authCode = fs.readFileSync(authPath, 'utf8');

authCode = authCode.replace(/authCallbacks\.add/g, 'this.authCallbacks.add');
authCode = authCode.replace(/authCallbacks\.forEach/g, 'this.authCallbacks.forEach');
authCode = authCode.replace(/authCallbacks\.delete/g, 'this.authCallbacks.delete');

authCode = authCode.replace(/lastAuthUser \!== null/g, 'this.lastAuthUser !== null');
authCode = authCode.replace(/cb\(lastAuthUser\)/g, 'cb(this.lastAuthUser)');
authCode = authCode.replace(/lastAuthUser = /g, 'this.lastAuthUser = ');
authCode = authCode.replace(/if \(lastAuthUser\)/g, 'if (this.lastAuthUser)');
authCode = authCode.replace(/\{ \.\.\.lastAuthUser/g, '{ ...this.lastAuthUser');

authCode = authCode.replace(/toAuthUser\(/g, 'this.toAuthUser(');

fs.writeFileSync(authPath, authCode, 'utf8');

const userPath = path.join('packages', 'studio-core', 'src', 'repositories', 'UserRepository.ts');
let userCode = fs.readFileSync(userPath, 'utf8');

userCode = userCode.replace(/ACCOUNT_GRACE_DAYS/g, 'this.ACCOUNT_GRACE_DAYS');
userCode = userCode.replace(/this\.this\./g, 'this.');
userCode = userCode.replace(/metaRef/g, 'this.metaRef');
userCode = userCode.replace(/this\.this\./g, 'this.');
userCode = userCode.replace(/parseDoc\(/g, 'this.parseDoc(');
userCode = userCode.replace(/this\.this\./g, 'this.');
userCode = userCode.replace(/ACCOUNT_GRACE_MS/g, 'this.ACCOUNT_GRACE_MS');
userCode = userCode.replace(/this\.this\./g, 'this.');
userCode = userCode.replace(/subscribeAccountStatus\(/g, 'this.subscribeAccountStatus(');
userCode = userCode.replace(/this\.this\./g, 'this.');

fs.writeFileSync(userPath, userCode, 'utf8');

const groovexPath = path.join('packages', 'studio-core', 'src', 'repositories', 'GroovexStemRepository.ts');
let groovexCode = fs.readFileSync(groovexPath, 'utf8');
groovexCode = groovexCode.replace(/isStemCached\(/g, 'this.isStemCached(');
groovexCode = groovexCode.replace(/R2_PROXY/g, 'this.R2_PROXY');
groovexCode = groovexCode.replace(/R2_DIRECT/g, 'this.R2_DIRECT');
groovexCode = groovexCode.replace(/getStemUrl\(/g, 'this.getStemUrl(');
groovexCode = groovexCode.replace(/fetchFromUrl\(/g, 'this.fetchFromUrl(');
groovexCode = groovexCode.replace(/getCachedStem\(/g, 'this.getCachedStem(');
groovexCode = groovexCode.replace(/fetchStemOnce\(/g, 'this.fetchStemOnce(');
groovexCode = groovexCode.replace(/cacheStem\(/g, 'this.cacheStem(');
groovexCode = groovexCode.replace(/this\.this\./g, 'this.');

fs.writeFileSync(groovexPath, groovexCode, 'utf8');
