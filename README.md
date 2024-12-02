# EventCache

Utility for [THREE.EventDispatcher](https://github.com/mrdoob/three.js/blob/master/src/core/EventDispatcher.js) to cache event data easy and neat, reducing object creation overhead. One-line get and update cached data. TypeScript support and automatic EventMap inference to keep single source of trust.

## Example
```ts
import { EventCache, EventCacheMapInfer } from "@vladkrutenyuk/event-cache";

const cache = new EventCache(/* payload */{ 
    moved: { x: 0, y: 0 },
    destroyed: {} 
});

// to keep one single source of trust and not to duplicate code
type CarEventMap = EventCacheMapInfer<typeof cache>;

class Car extends THREE.EventDispatcher<CarEventMap> {
    moved(x: number, y: number) {
        // one-line usage, implementation based on Proxy
        this.dispatchEvent(cache.use("moved")("x", x)("y", y));
    }
    destroy() {
        this.dispatchEvent(cache.use("destroyed"));
    }
}

const car1 = new Car(), car2 = new Car();

car1.moved(2, 28);
car2.moved(14, 88);
car1.destroy();
// etc
```
## Installation
**ES module case**

- via npm and build tool
```bash
pnpm install @vladkrutenyuk/event-cache
```
- or via importmap:
```html
<script type="importmap">
  {
    "imports": {
      "@vladkrutenyuk/event-cache": "https://unpkg.com/@vladkrutenyuk/event-cache/dist/eventcache.esm.min.js"
    }
  }
</script>
```
and
```js
import { EventCache } from "@vladkrutenyuk/event-cache";

const cache = new EventCache({...});
```
**UMD case**
```html
<script src="https://unpkg.com/@vladkrutenyuk/event-cache/dist/eventcache.umd.min.js"></script>
```
```js
const { EventCache } = eventcache;

const cache = new EventCache({...});
```