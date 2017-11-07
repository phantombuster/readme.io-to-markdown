const fs = require("fs")

const docBaseUrl = process.argv[2]

const baseFolder = "./v1"

const folders = fs.readdirSync(baseFolder)
const ticks = "```"
const emoTab = {
	warning: ":warning:",
	info: ":information_source:",
	danger: ":no_entry_sign:"
}
const toc = {}
let newDoc = ""

// Function to parse text from a file and return all blocks (samples of code or callouts)
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

// Function to parse text from a file and return the title of the section
const parseTitle = (text) => {
	const data = {}
	const regex = /---\ntitle: (.*)\nexcerpt: "(.*)"\n---/gm
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
				data.secondTitle = match.replace(/\"/g, "")
			}
			if (groupIndex === 2) {
				data.title = match
			}
		})
	}
	return data
}

// Function to replace the anchor from readme.io to direct links to the readme.io documentation (or any other url in argument)
const changeAnchors = (text) => {
	const regex = /\[.*?\]\((#.*?)\)/g
	let m
	const links = []
	let i = 0

	while((m = regex.exec(text)) !== null) {
		if (m.index === regex.lastIndex) {
			regex.lastIndex++
		}
		m.forEach((match, groupIndex) => {
			if (groupIndex === 1) {
				links.push(match)
			}
		})
	}
	for (const link of links) {
		console.log(link)
		text = text.replace(`(${link})`, `(${docBaseUrl}${link})`)
	}
	return text
}

// Simple function just to format the anchor from a title
const createLink = (title) => {
	return title.replace("(", "").replace(")", "").replace("]", "").replace(/\s\[\,\s/g, "--").replace(/\,\s/g, "-").replace("[", "").toLowerCase().replace(" ", "")
}

for (const folder of folders) {
	const textObject = []
	let files = fs.readdirSync(`${baseFolder}/${folder}`)
	const sectionName = folder.charAt(0).toUpperCase() + folder.slice(1)
	newDoc += `\n# ${sectionName}\n\n`
	toc[sectionName] = []
	for (const file of files) {
		console.log(`Changing file ${folder}/${file}...`)
		const func = {}
		let text = fs.readFileSync(`${baseFolder}/${folder}/${file}`).toString()
		text = changeAnchors(text)
		const fn = parseTitle(text)
		if (fn.title === "" && fn.secondTitle)
			fn.title = fn.secondTitle
		else if (fn.title === "")
			fn.title = file.replace("nick-", "").replace(".md", "")
		toc[sectionName].push({title: fn.title.replace(/\(.*\)/, "()"), link: createLink(fn.title)})
		func.realTitle = fn.title
		func.title = fn.title.replace(/\(.*\)/, "()")
		fn.title = "\n# " + fn.title
		text = text.replace(fn.full, fn.title)
		const blocks = parseBlocks(text)
		for (const block of blocks) {
			if (block.type === "callout") {
				const example = block.code
				const mdExample = `\n##### ${emoTab[example.type]} ${example.title}\n> ${example.body}\n`
				text = text.replace(block.full, "")
				text += mdExample
			}
			if (block.type === "code") {
				const example = block.code.codes[0]
				example.name = example.name.replace("Async/Await", "Example")
				const mdExample = `\n##### ${example.name}\n${ticks}${example.language}\n${example.code}\n${ticks}\n`
				text = text.replace(block.full, "")
				text += mdExample
			}
		}
		text = text.replace(/\#\# \—/g, "### —")
		func.text = text
		textObject.push(func)
	}
	textObject.sort((a, b) => {
		if (a.realTitle < b.realTitle)
			return -1
		if (a.realTitle > b.realTitle)
			return 1
		return 0
	})
	for (const myFunc of textObject) {
		newDoc += myFunc.text
	}
}
let tocText = ""
for (let bigTitle in toc) {
	tocText += `+ [${bigTitle.replace("-", " ")}](#${bigTitle.toLowerCase()})\n`
	toc[bigTitle].sort((a, b) => {
		if (a.title < b.title)
			return -1;
		if (a.title > b.title)
			return 1;
		return 0;
	})
	for (const func of toc[bigTitle]) {
		tocText += `  + [${func.title}](#${func.link})\n`
	}
}

const myDoc = `# Documentation

${tocText}

${newDoc}`
fs.writeFileSync("./doc.md", myDoc)
console.log("Transform finished, get your doc in doc.md.")
