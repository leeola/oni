/**
 * CommandManager.ts
 *
 * Manages Oni commands. These commands show up in the command palette, and are exposed to plugins.
 */

import * as values from "lodash/values"

import { INeovimInstance } from "./../neovim"

import { ITask, ITaskProvider } from "./Tasks"

export type ICommandCallback = (args?: any) => any

export interface ICommand {
    command: string
    name: string
    detail: string
    execute: ICommandCallback
}

export class CallbackCommand implements ICommand {
    constructor(
        public command: string,
        public name: string,
        public detail: string,
        public execute: ICommandCallback) {
        }
}

export class VimCommand implements ICommand {

    constructor(
        public command: string,
        public name: string, public detail: string,
        private _vimCommand: string,
        private _neovimInstance: INeovimInstance) {

    }

    public execute(): void {
        this._neovimInstance.command(this._vimCommand)
    }
}

export class CommandManager implements ITaskProvider {

    private _commandDictionary: { [key: string]: ICommand } = {}

    public registerCommand(command: ICommand): void {

        if (this._commandDictionary[command.command]) {
            console.error(`Tried to register multiple commands for: ${command.name}`)
            return
        }

        this._commandDictionary[command.command] = command
    }

    public executeCommand(name: string, args?: any): boolean | void {
        const command = this._commandDictionary[name]

        if (!command) {
            console.error(`Unable to find command: ${name}`)
            return false
        }

        return command.execute(args)
    }

    public getTasks(): Promise<ITask[]> {
        const commands = values(this._commandDictionary)
        const tasks = commands.map((c) => ({
            name: c.name,
            detail: c.detail,
            callback: () => c.execute(),
        }))
        return Promise.resolve(tasks)
    }
}

export const commandManager = new CommandManager()
