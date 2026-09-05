# Demo sandbox

Open <https://recall-objective-map.sociobot.in/demo> or `/demo` locally. The
landing page also opens it with one click through **Try it with sample data**.

The sample maps four orbital-mechanics and graph-reading objectives. It includes a
parent with two sub-objectives, recent Explain/Solve/Recognize attempts, and one older
attempt that appears in the 30-day evidence window.

The yellow banner remains visible throughout the demo. **Reset demo** replaces demo
changes with the original sample. **Start for real** opens `/map` and loads only the
real storage namespace.

Demo records use IndexedDB database `recall-objective-map-demo`. If IndexedDB is not
available, they use localStorage key `demo:recall-objective-map:data`. Real records use
database `recall-objective-map` and key `recall-objective-map:data`; demo code never
reads or writes them.
