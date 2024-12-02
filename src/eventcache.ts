// @vladkrutenyuk/three-event-cache
type EventTypeMap = {
	[key: string]: { [dataKey: string]: any };
};

type EventCachePayload<T> = {
	[K in keyof T]: T[K];
};

type EventDataChangable<TObj> = {
	<TKey extends keyof Omit<TObj, "type">, TValue extends TObj[TKey]>(
		key: TKey,
		value: TValue
	): EventDataChangable<TObj>;
} & TObj;

export type EventCacheMapInfer<T extends EventCache<any>> = T["payload"];

/**
 * Created by {@link https://www.linkedin.com/in/vladkrutenyuk | Vlad Krutenyuk}.
 * Utility for THREE.EventDispatcher to use cache event data easy and neat to prevent frequent creation of new objects.
 * Based on Proxy. Supports Typescript.
 * @example
 * // where `payload` is single source of trust
 * const cache = new EventCache({ 
 * 	moved: { x: 0, y: 0 },
 * 	destroyed: {} 
 * });
 *
 * // based on it we can infer our EventMap type
 * type CarEventMap = EventCacheMapInfer<typeof cache>;
 *
 * class Car extends THREE.EventDispatcher<CarEventMap> {
 * 	moved(x: number, y: number) {
 * 		this.dispatchEvent(cache.use("moved")("x", x)("y", y));
 * 	}
 * 	destroy() {
 * 		this.dispatchEvent(cache.use("destroyed"));
 * 	}
 * }
 */
export class EventCache<TEventMap extends EventTypeMap> {
	static createChangableEventData<T extends object>(obj: T): EventDataChangable<T> {
		const proxy = new Proxy(() => {}, {
			apply(_target, _thisArg, args) {
				const [key, value] = args;
				obj[key] = value;
				return proxy;
			},
			get(target, key) {
				return key in obj ? obj[key] : target[key];
			},
			set(_target, key, value) {
				if (!(key in obj)) return false;
				obj[key] = value;
				return true;
			},
		});
		return proxy as EventDataChangable<T>;
	}

	/**
	 * It is public field to infer event map type easy.
	 * Don't touch it please.
	 */
	readonly payload: EventCachePayload<TEventMap>;

	private readonly _events: {
		[K in keyof TEventMap]: EventDataChangable<TEventMap[K] & { type: K }>;
	};

	/**
	 * Creates {@linkcode EventCache | EventCache} object.
	 * @param payload - Event data template (kind of). See example in class's doc.
	 */
	constructor(payload: EventCachePayload<TEventMap>) {
		const descriptor = payload as {
			[K in keyof TEventMap]: TEventMap[K] & { type: K; target: any };
		};
		this._events = {} as any;
		for (const key in descriptor) {
			const event = descriptor[key];
			event["type"] = key;
			event["target"] = null;
			this._events[key] = EventCache.createChangableEventData(event);
		}
		this.payload = Object.freeze({ ...payload });
	}

	/**
	 * To get inline changable event's data for providen event's type to use it for event dispatching.
	 * @example
	 * this.dispatchEvent(cache.use("moved")("x", 2)("y", 28)); // -> { type: "moved", x: 2, y: 28 }
	 * // or
	 * this.dispatchEvent(cache.use("destroyed")); // -> { type: "destroyed" }
	 * @param type - Type of event you need.
	 * @returns Changable Event Data, see example.
	 */
	use<TType extends keyof TEventMap>(type: TType) {
		return this._events[type];
	}
}