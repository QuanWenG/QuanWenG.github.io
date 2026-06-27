1. List Set Queue Map区别
- List 有序可重复
- Set 不可重复
- Queue 按特定顺序
- Map 键值对存储 key无序不可重复

2. List
- ArrayList 数组
- Vector 数据
- LinkedList 双向链表

3. Set
- HashSet 无序唯一 底层HashMap
- LinkedHashSet HashSet的子类
- TreeSet 有序唯一 红黑树

4. Queue
- PriorityQueue 数组实现小顶堆
- DelayQueue
- ArrayDeque 可扩容动态双向数组

5. Map
- HashMap 数组+链表 1.8后红黑树
- LinkedHashMap 增加了双向链表
- HashTable 数组+链表
- TreeMap 红黑树