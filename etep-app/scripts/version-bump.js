const fs = require('fs');
const path = require('path');

const versionPath = path.join(__dirname, '..', 'version.json');
const packagePath = path.join(__dirname, '..', 'package.json');

// Lê versão atual
const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Incrementa build
version.build += 1;

// Atualiza timestamp
const now = new Date();
version.buildDate = now.toISOString().split('T')[0];
version.buildTime = now.toTimeString().split(' ')[0];

// Atualiza string de versão
version.version = `${version.major}.${version.minor}.${version.patch}`;

// Atualiza package.json
package.version = version.version;

// Salva arquivos
fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));

console.log(`Versão atualizada para: ${version.version} (build ${version.build})`);