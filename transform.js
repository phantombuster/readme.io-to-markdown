const fs = require("fs")

const baseFolder = "./v1"

const folders = fs.readdirSync(baseFolder)
const ticks = "```"
const emoTab = {
	warning: ":warning:",
	info: ":information_source:",
	danger: ":no_entry_sign:"
}
let newDoc = `<p align="center">
  <a href="http://nickjs.org/">
    <img alt="NickJS" src="https://raw.githubusercontent.com/phantombuster/nickjs/master/logo.png">
  </a>
</p>

<p align="center">
  A modern headless browser library, as simple as it is powerful.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/nickjs"><img alt="NPM version" src="https://img.shields.io/npm/v/nickjs.svg?style=flat-square"></a>
  <a href="https://gitter.im/phantombuster/nickjs"><img alt="Gitter room" src="https://img.shields.io/gitter/room/Phantombuster/Lobby.svg?style=flat-square"></a>
  <a href="https://twitter.com/phbuster"><img alt="Twitter follow" src="https://img.shields.io/twitter/follow/phbuster.svg?style=social&label=Follow"></a>
</p>

<p align="center">
  <a href="http://nickjs.org">NickJS.org</a> — <b><a href="https://hub.phantombuster.com/v1/reference#nick">Documentation</a></b>
</p>

* 13 methods only
* Async-await ready (it also works with callbacks)
* Built to support any driver (today PhantomJS+CasperJS; Chromium headless coming soon)

NickJS started as a very basic need to simplify our lives writing lines of PhantomJS.
<br>As we started working on [Phantombuster](https://phantombuster.com), we realised we needed a higher-level library, as simple and powerful as possible, and which would be evolutive since it was clear Chromium headless was going to be a big thing.

We hope you'll enjoy using it and to get the discussion started.

Feel free to get in touch, suggest pull requests and add your own drivers!`

const parseBlocks = (text) => {
	const regex = /\[block:(\w*)\]\n([\s\S]*?)\n\[\/block]/gm;
	const data = []
	let m
	let i = 0		
	while ((m = regex.exec(text)) !== null) {
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}
		m.forEach((match, groupIndex) => {
			if (groupIndex === 0) {
				data[i] = {}
				data[i].full = match
			}
			if (groupIndex === 1) {
				data[i].type = match
			}
			if (groupIndex === 2) {
				data[i].code = JSON.parse(match)
				i++
			}
		})
	}
	return data
}

const parseTitle = (text) => {
	const data = {}
	const regex = /---\ntitle: .*\nexcerpt: "(.*)"\n---/gm
	let m

	while ((m = regex.exec(text)) !== null) {
		if (m.index === regex.lastIndex) {
				regex.lastIndex++
		}
		m.forEach((match, groupIndex) => {
			if (groupIndex === 0) {
				data.full = match
			}
			if (groupIndex === 1) {
				data.title = match
			}
		})
	}
	return data
}

for (folder of folders) {
	const files = fs.readdirSync(`${baseFolder}/${folder}`)
	newDoc += `\n# ${folder}\n\n`
	for (file of files) {
		let text = fs.readFileSync(`${baseFolder}/${folder}/${file}`).toString()
		const fn = parseTitle(text)
		if (fn.title === "")
			fn.title = file.replace("nick-", "").replace(".md", "")
		fn.title = "\n# " + fn.title
		text = text.replace(fn.full, fn.title)
		const blocks = parseBlocks(text)
		// console.log(JSON.stringify(data, null, 2))
		for (const block of blocks) {
			if (block.type === "callout") {
				const example = block.code
				const mdExample = `\n### ${emoTab[example.type]} ${example.title}\n${example.body}`
				text = text.replace(block.full, "")
				text += mdExample
			}
			if (block.type === "code") {
				const example = block.code.codes[0]
				example.name = example.name.replace("Async/Await", "Example")
				const mdExample = `\n### ${example.name}\n${ticks}${example.language}\n${example.code}\n${ticks}\n`
				text = text.replace(block.full, "")
				text += mdExample
			}
		}
		newDoc += text
	}
}

fs.writeFileSync("./doc.md", newDoc)
