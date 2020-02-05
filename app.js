#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const commander = require('commander');
const logger = require('./lib/logger');
const pkgJson = require('./package.json');

function templateRedirect(from, to) {
    return `<rule name="${decodeURI(to.split('/').join(' ')).trim()}">
    <match url="^${from}$" ignoreCase="true" />
    <action type="Redirect" redirectType="Permanent" url="${to}" />
</rule>\n`;
}

function generateRedirects(fileName, options) {

    if (path.extname(fileName) !== '.txt') {
        logger.error('O arquivo deve ser no formato texto!');
        return;
    }

    fs.readFile(`./${fileName}`, (err, data) => {
        if (err) throw err;
        let xml = '';
        const obj = {};
        const arr = data.toString('utf8').replace(/  /g, ' ').split('\n');

        arr.forEach(item => {
            if (!item) return;

            const separatedLink = options.separator ? item.split(options.separator) : item.split('redirects-to');
            const regex = new RegExp(`http(s?)://${options.siteName}/`, 'g');
            const oldLink = separatedLink[0].replace(regex, '').trim();
            const newLink = separatedLink[1].replace(regex, '').trim();

            if (obj[newLink]) {
                obj[newLink].push(oldLink);
                return;
            }

            obj[newLink] = [oldLink];
        });

        Object.keys(obj).forEach(item => {
            if (obj[item].length === 1) {
                xml += templateRedirect(obj[item][0], item);
                return;
            }

            xml += templateRedirect(obj[item].join('|'), item);
        });

        fs.writeFile('./redirect.xml', xml);
        logger.success('Convertido com sucesso!');
        logger.info('Exportado o redirect para o arquivo: redirect.xml');
    });
}

commander.version(pkgJson.version, '-v, --version');

commander.command('generate <fileName>')
    .alias('g')
    .option('--siteName [siteName]', 'Nome do site pra dar replace')
    .option('--separator [separator]', 'Separador entre os links (default: redirects-to')
    .description('gerador de redirects')
    .action(generateRedirects);

commander.parse(process.argv);