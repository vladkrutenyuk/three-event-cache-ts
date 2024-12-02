import * as THREE from "three";
import { EventCache, EventCacheMapInfer } from "./eventcache";

describe("EventCache", () => {
	it("должен корректно инициализировать payload и сделать его неизменяемым", () => {
		const payload = { moved: { x: 0, y: 0 }, destroyed: {} };
		const cache = new EventCache(payload);

		expect(cache.payload).toEqual(payload); // Структурное равенство
		expect(Object.isFrozen(cache.payload)).toBe(true); // Верхний уровень заморожен
		expect(Object.isFrozen(cache.payload.moved)).toBe(false); // Вложенные объекты НЕ заморожены
	});

	it("должен возвращать изменяемые данные события через use()", () => {
		const payload = { moved: { x: 0, y: 0 }, destroyed: {} };
		const cache = new EventCache(payload);

		const eventData = cache.use("moved");
		expect(eventData.x).toBe(0);
		expect(eventData.y).toBe(0);

		eventData("x", 42)("y", 84); // Изменение значений через Proxy
		expect(eventData.x).toBe(42);
		expect(eventData.y).toBe(84);
	});

	it("должен поддерживать типизацию через EventCacheMapInfer", () => {
		const payload = { moved: { x: 0, y: 0 }, destroyed: {} };
		const cache = new EventCache(payload);

		type TestEventMap = EventCacheMapInfer<typeof cache>;
		const testType: TestEventMap = { moved: { x: 10, y: 20 }, destroyed: {} };

		expect(testType.moved.x).toBe(10);
	});

	it("должен корректно работать в классе, наследующем THREE.EventDispatcher", () => {
		const payload = { moved: { x: 0, y: 0 }, destroyed: {} };
		const cache = new EventCache(payload);

		class Car extends THREE.EventDispatcher<EventCacheMapInfer<typeof cache>> {
			moved(x: number, y: number) {
				this.dispatchEvent(cache.use("moved")("x", x)("y", y));
			}
			destroy() {
				this.dispatchEvent(cache.use("destroyed"));
			}
		}

		const car = new Car();
		const movedHandler = jest.fn();
		const destroyedHandler = jest.fn();

		car.addEventListener("moved", movedHandler);
		car.addEventListener("destroyed", destroyedHandler);

		car.moved(10, 20);
		car.destroy();

		// Проверка вызова обработчика moved
		expect(movedHandler).toHaveBeenCalledTimes(1);
		const movedEvent = movedHandler.mock.calls[0][0]; // Получаем переданный объект
		expect(movedEvent.type).toBe("moved");
		expect(movedEvent.x).toBe(10);
		expect(movedEvent.y).toBe(20);

		// Проверка вызова обработчика destroyed
		expect(destroyedHandler).toHaveBeenCalledTimes(1);
		const destroyedEvent = destroyedHandler.mock.calls[0][0];
		expect(destroyedEvent.type).toBe("destroyed");
	});

	it("должен поддерживать обновление данных события через Proxy", () => {
		const payload = { moved: { x: 0, y: 0 }, destroyed: {} };
		const cache = new EventCache(payload);

		const movedEventData = cache.use("moved");
		movedEventData("x", 42)("y", 84);

		expect(movedEventData.x).toBe(42);
		expect(movedEventData.y).toBe(84);

		// Убеждаемся, что вызов `set` через Proxy обновляет исходный объект
		const rawMovedEvent = payload.moved;
		expect(rawMovedEvent.x).toBe(42);
		expect(rawMovedEvent.y).toBe(84);
	});

	it("должен корректно работать с несколькими типами событий", () => {
		const payload = {
			start: { value: "begin" },
			end: { success: false },
		};
		const cache = new EventCache(payload);

		const startEvent = cache.use("start");
		startEvent("value", "go");

		const endEvent = cache.use("end");
		endEvent("success", true);

		expect(startEvent.value).toBe("go");
		expect(endEvent.success).toBe(true);
	});

	it("должен перезаписывать данные в одном и том же объекте при каждом вызове события", () => {
		const payload = { moved: { x: 0, y: 0 }, destroyed: {} };
		const cache = new EventCache(payload);

		class Car extends THREE.EventDispatcher<EventCacheMapInfer<typeof cache>> {
			moved(x: number, y: number) {
				this.dispatchEvent(cache.use("moved")("x", x)("y", y));
			}
			destroy() {
				this.dispatchEvent(cache.use("destroyed"));
			}
		}

		const car1 = new Car();
		const car2 = new Car();

		const movedHandler = jest.fn();
		const destroyedHandler = jest.fn();

		car1.addEventListener("moved", movedHandler);
		car1.addEventListener("destroyed", destroyedHandler);

		car2.addEventListener("moved", movedHandler);
		car2.addEventListener("destroyed", destroyedHandler);

		// Вызов события для car1
		car1.moved(10, 20);
		let car1MovedEvent = movedHandler.mock.calls[0][0]; // 1
		expect(car1MovedEvent.type).toBe("moved");
		expect(car1MovedEvent.x).toBe(10);
		expect(car1MovedEvent.y).toBe(20);

		car1.destroy();
		const car1DestroyedEvent = destroyedHandler.mock.calls[0][0];
		expect(car1DestroyedEvent.type).toBe("destroyed");

		// Вызов события для car2
		car2.moved(30, 40);
		let car2MovedEvent = movedHandler.mock.calls[1][0]; // 2
		expect(car2MovedEvent.type).toBe("moved");
		expect(car2MovedEvent.x).toBe(30);
		expect(car2MovedEvent.y).toBe(40);

		car2.destroy();
		const car2DestroyedEvent = destroyedHandler.mock.calls[1][0];
		expect(car2DestroyedEvent.type).toBe("destroyed");

		// Проверяем, что объект события для car1 перезаписывается при следующем вызове
		car1.moved(50, 60);

		// 3 а берем специально 3-ий (то есть [1]) потому что объект переисопльзуется
		car1MovedEvent = movedHandler.mock.calls[1][0];

		expect(car1MovedEvent.type).toBe("moved");
		expect(car1MovedEvent.x).toBe(50);
		expect(car1MovedEvent.y).toBe(60);

		// Проверяем, что объект события для car2 перезаписывается при следующем вызове
		car2.moved(70, 80);
		car2MovedEvent = movedHandler.mock.calls[2][0]; // 4
		expect(car2MovedEvent.type).toBe("moved");
		expect(car2MovedEvent.x).toBe(70);
		expect(car2MovedEvent.y).toBe(80);

		// Проверяем количество вызовов обработчиков
		expect(movedHandler).toHaveBeenCalledTimes(4);
		expect(destroyedHandler).toHaveBeenCalledTimes(2);
	});
});
