import ArraySet from "./ArraySet.js";
import ClassSet from "./ClassSet.js";
import Common from "./Common.js";
import Configure from "./Configure.js";
import ObjectSet from "./ObjectSet.js";

Configure.register(Common);
Configure.register(ObjectSet);
Configure.register(ArraySet);
Configure.register(ClassSet);

export { Configure, ArraySet, ObjectSet, ClassSet };
