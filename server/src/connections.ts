// This file is part of HFS - Copyright 2021-2022, Massimo Melina <a@rejetto.com> - License https://www.gnu.org/licenses/gpl-3.0.txt

import { Socket } from 'net'
import events from './events'
import Koa from 'koa'
import _ from 'lodash'

export class Connection {
    readonly started = new Date()
    got = 0
    sent = 0
    alreadyEmitted = false // already communicated to
    outSpeed?: number
    ctx?: Koa.Context
    private _cachedIp?: string
    [rest:symbol]: any // let other modules add extra data, but using symbols to avoid name collision

    constructor(readonly socket: Socket, readonly secure: boolean) {
        all.push(this)
        socket.on('data', data =>
            this.got += data.length )
        socket.on('close', () => {
            all.splice(all.indexOf(this), 1)
            if (this.alreadyEmitted)
                events.emit('connectionClosed', this)
        })
        events.emit('socket', socket)
    }

    get ip() {
        return this.ctx?.ip ?? (this._cachedIp = (this._cachedIp ?? normalizeIp(this.socket.remoteAddress||'')))
    }
}

export function normalizeIp(ip: string) {
    return ip.replace(/^::ffff:/,'') // simplify ipv6-mapped addresses
}

const all: Connection[] = []

export function newConnection(socket: Socket, secure:boolean=false) {
    new Connection(socket, secure)
}

export function getConnections(): Readonly<typeof all> {
    return all
}

export function socket2connection(socket: Socket) {
    return all.find(x => // socket exposed by Koa is TLSSocket which encapsulates simple Socket, and I've found no way to access it for simple comparison
        x.socket.remotePort === socket.remotePort // but we can still match them because IP:PORT is key
        && x.socket.remoteAddress === socket.remoteAddress )
}

export function updateConnection(conn: Connection, change: Partial<Connection>) {
    // if no change is detected, skip update. ctx is a special case
    if (!change.ctx && Object.entries(change).every(([k,v]) => _.isEqual(v, conn[k as keyof Connection]) ))
        return
    Object.assign(conn, change)
    events.emit(conn.alreadyEmitted ? 'connectionUpdated' : 'connection', conn, change)
    conn.alreadyEmitted = true
}
