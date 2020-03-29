type EventType = string | IEvent

export interface IEvent {
    type: string,
    timeStamp:  Date
}


export interface IEmitter {
    events: Object
    on: (type: string, handler: () => void) => void
    off: (type: string, handler: () => void) => void
    trigger: (event: IEvent, args: Array<IEvent>) => void
    _dispatch: (event: IEvent, args: Array<IEvent>) => void
    _offByHandler: (type: string, handler: () => void) => void
    _offByType: (type: string) => void
    _offAll: () => void
}