'use strict';

const chokidar = require('chokidar');
const logger = require('./terminalLogger');
const regexMap = require('./regexCommandMap');

const taskFunctionMap = {
	'start': cmdName => {
		window.store.emit('COMMAND_START', cmdName);
	},
	'restart': cmdName => {
		window.store.emit('COMMAND_RESTART', cmdName);
	},
	'kill': cmdName => {
		window.store.emit('COMMAND_KILL', cmdName);
	}
}

function invalidCommandMsg(x) {
	return `ERROR: Invalid command ${x} in 'watch' in .nsgrc file`;
}

function getTask(command) {
	

	return Object.keys(regexMap).find(task => {
		return regexMap[task].test(command)
	});
}

function createCmdWatcher(keyPattern, valuePattern) {
	console.log('\n**\nfound CMD: ', keyPattern);
	// default task is 'START' // check for blank spaces
	if ((/ /g).test(valuePattern) === false)
		valuePattern = 'START ' + valuePattern;

	const keyNpmScript = keyPattern.replace(/^CMD /, '');
	const valueTask = getTask(valuePattern);

	if (!valueTask || !taskFunctionMap[valueTask])
		return logger(invalidCommandMsg(valuePattern));

	const func = taskFunctionMap[valueTask];
	const valueNpmScript = valuePattern.slice(valueTask.length).trim();

	console.log('keyNpmScript: ', keyNpmScript);
	console.log('valueTask: ', valueTask);
	console.log('valueNpmScript: ', valueNpmScript);

	window.store.on('COMMAND_END', cmdName => {
		if (window.store.state.windowClosing)
			return;
		if (cmdName === keyNpmScript)
			taskFunctionMap[valueTask](valueNpmScript);
	});
}

function createFileWatcher(pattern, command) {
	// default task is 'START' // check for blank spaces
	if ((/ /g).test(command) === false)
		command = 'START ' + command;

	const task = getTask(command);

	if (!task || !taskFunctionMap[task])
		return logger(invalidCommandMsg(command));

	const fileWatcher = chokidar.watch(pattern);
	const func = taskFunctionMap[task];
	const npmScript = command.slice(task.length).trim();
	
	console.log('\n--\npattern: ', pattern);
	console.log('task: ', task);
	console.log('func: ', func);
	console.log('npmScript: ', npmScript);
	fileWatcher.on('change', path => func(npmScript));
}

function parseWatchObject(watchObj) {
	if (!watchObj) return;
	Object.keys(watchObj).forEach(pattern => {
		if (/^CMD ([\d\w-])+$/i.test(pattern))
			createCmdWatcher(pattern.trim(), watchObj[pattern].trim());
		else
			createFileWatcher(pattern.trim(), watchObj[pattern].trim())
	});
}

module.exports = parseWatchObject;
