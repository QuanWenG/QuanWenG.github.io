Java 集合框架以接口定义能力，再由不同实现提供有序性、唯一性、并发性和性能方面的取舍。选择集合时，先明确是否需要顺序、重复元素、键值映射以及并发访问。

## 核心接口

| 接口 | 语义 | 常见实现 |
| --- | --- | --- |
| `List` | 按索引排列，可包含重复元素 | `ArrayList`、`LinkedList` |
| `Set` | 不包含依据相等规则重复的元素 | `HashSet`、`LinkedHashSet`、`TreeSet` |
| `Queue` / `Deque` | 按队列或双端队列规则访问元素 | `PriorityQueue`、`ArrayDeque`、`LinkedList` |
| `Map` | 保存键到值的映射，键不能重复 | `HashMap`、`LinkedHashMap`、`TreeMap` |

“有序”需要进一步区分：可能是插入顺序、访问顺序、自然顺序或比较器顺序。`Map` 本身不承诺顺序，具体实现可能有不同保证。

## List

### ArrayList

`ArrayList` 基于可扩容数组实现。按索引随机访问通常为 O(1)，尾部追加的均摊复杂度为 O(1)；在中间插入或删除通常需要移动后续元素，复杂度为 O(n)。它不是线程安全集合。

### LinkedList

`LinkedList` 基于双向链表，同时实现 `List` 和 `Deque`。已定位节点后的插入、删除可以是 O(1)，但按索引查找需要遍历，通常为 O(n)。在多数只需队列功能的场景，`ArrayDeque` 往往具有更好的局部性和更低的对象开销。

### Vector

`Vector` 同样基于可扩容数组，其常用方法带同步。它属于较早期 API；新代码若需要并发访问，应根据实际读写模式选择同步包装、并发集合或显式锁，而不是仅因“线程安全”默认使用 `Vector`。

## Set

- `HashSet` 通常基于 `HashMap`，不保证迭代顺序；`add`、`contains` 的平均复杂度通常为 O(1)。
- `LinkedHashSet` 在哈希结构之外维护链接关系，通常按插入顺序迭代。
- `TreeSet` 基于有序树结构，按自然顺序或 `Comparator` 排序，常见操作通常为 O(log n)。

哈希集合依赖元素的 `equals` 与 `hashCode` 契约。元素进入集合后若参与相等性或哈希计算的字段发生变化，后续查找和删除可能出现异常结果。

## Queue 与 Deque

- `PriorityQueue` 使用二叉堆维护优先级，队头是比较规则下优先级最高的元素；遍历结果本身不保证整体有序。
- `ArrayDeque` 使用可扩容循环数组实现双端队列，适合栈和普通队列，不允许 `null` 元素。
- `DelayQueue` 是并发延迟队列，只能取得已经到期的元素，元素需实现 `Delayed`。

## Map

### HashMap

`HashMap` 使用哈希表存储键值对，不保证迭代顺序，也不是线程安全的。Java 8 之后，桶中冲突节点通常先以链表组织；当冲突足够多且表容量达到要求时，桶可能树化为红黑树，以改善极端冲突下的查询复杂度。

`HashMap` 允许一个 `null` 键和多个 `null` 值。键应保持影响 `equals` 与 `hashCode` 的状态不变。

### LinkedHashMap

`LinkedHashMap` 在哈希表之外维护双向链接，可配置为按插入顺序或访问顺序迭代。访问顺序模式常用于实现容量受控的 LRU 缓存，但仍需自行处理并发和淘汰策略。

### TreeMap

`TreeMap` 基于红黑树，按键的自然顺序或指定比较器排序，常见查找、插入和删除操作为 O(log n)。比较器必须与预期的键相等语义保持一致，否则可能出现“比较为相等但 `equals` 不相等”的键被视为同一个映射项。

### Hashtable 与并发 Map

`Hashtable` 是较早期的同步哈希表，不允许 `null` 键和值。现代并发场景通常优先考虑 `ConcurrentHashMap`，但复合操作仍应使用它提供的原子方法，例如 `computeIfAbsent`，而不是把多步读写误认为自动原子。

## 选择建议

- 主要按索引读取：优先考虑 `ArrayList`。
- 作为栈或双端队列：优先考虑 `ArrayDeque`。
- 需要去重且不关心顺序：考虑 `HashSet`。
- 需要保留插入顺序：考虑 `LinkedHashSet` 或 `LinkedHashMap`。
- 需要排序、范围查询：考虑 `TreeSet` 或 `TreeMap`。
- 多线程共享：根据操作模型选择并发集合，仍要审视复合操作的原子性。
