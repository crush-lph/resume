# 技术讲解

## 什么问题

### 1. 长列表渲染问题

问题：渲染整个长列表容易造成**页面阻塞**，用户体验不好

解决方案：

- 时间分片
  - 效率低
  - 不直观
  - 性能差
- 虚拟列表（推荐使用）

### 2. 虚拟列表原理

设置一个**可视区域**，然后用户在滚动列表的时候，本质上是**动态修改可视区域里面的内容**。

例如，一开始渲染前面 5 个项目

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-07-01-082418.png" alt="image-20240701162418114" style="zoom:40%;" />

之后用户进行滚动，就会动态的修改可视区域里面的内容，如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-07-01-082813.png" alt="image-20240701162813149" style="zoom:50%;" />

### 3. 虚拟列表的实现

假设列表里面每一项**定高**，我们需要得到一些信息：

1. 可视区域起始数据索引(startIndex)
2. 可视区域结束数据索引(endIndex)
3. 可视区域的数据
4. 整个列表中的偏移位置 startOffset

如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-07-01-084455.png" alt="image-20240701164454859" style="zoom:50%;" />

整个虚拟列表的设计如下：

```html
<!-- 可视区域容器 -->
<div class="infinite-list-container">
  <!-- 这是容器里面的占位，高度是总列表高度，用于形成滚动条 -->
  <div class="infinite-list-phantom"></div>
  <!-- 列表项渲染区域 -->
  <div class="infinite-list">
    <!-- item-1 -->
    <!-- item-2 -->
    <!-- ...... -->
    <!-- item-n -->
  </div>
</div>
```

- infinite-list-container: 可视区域容器
- infinite-list-phantom： 这是容器里面的占位，高度是总列表高度，用于形成滚动条
- infinite-list：列表项渲染区域

如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-07-01-085848.png" alt="image-20240701165847905" style="zoom:50%;" />

接下来监听 infinite-list-container 的 scroll 事件，获取滚动位置的 scrollTop

- 假定可视区域高度固定，称之为 screenHeight
- 假定列表每项高度固定，称之为 itemSize
- 假定列表数据称之为 listData
- 假定当前滚动位置称之为 scrollTop

那么我们能够计算出这么一些信息：

1. 列表总高度 listHeight = listData.length \* itemSize
2. 可显示的列表项数 visibleCount = Math.ceil(screenHeight / itemSize)
3. 数据的起始索引 startIndex = Math.floor(scrollTop / itemSize)
4. 数据的结束索引 endIndex = startIndex + visibleCount
5. 列表显示数据为 visibleData = listData.slice(startIndex, endIndex)

当发生滚动之后，由于渲染区域相对于可视区域发生了偏移。我们需要计算出来这个偏移量，然后使用 transform 将 list 重新移回到可视区域。

偏移量 startOffset = scrollTop - (scrollTop % itemSize)

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-07-01-090127.png" alt="image-20240701170126764" style="zoom:50%;" />

### 4. 遗留问题

**1. 动态高度**

目前的虚拟列表，是定高度 itemSize，所以很多东西很容易计算

- 列表总高度：listHeight = listData.length \* itemSize
- 偏移量的计算：startOffset = scrollTop - (scrollTop % itemSize)
- 数据的起始索引 startIndex = Math.floor(scrollTop / itemSize)

但是在实际应用中，很多条目并非高度相同：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-07-02-004546.png" alt="image-20240702084546314" style="zoom:50%;" />

因此在这种不定高的场景下，会遇到这么一些问题：

1. 如何获取真实高度？
2. 相关属性的计算有何变化？
3. 列表的渲染方式有什么改变？

**2. 白屏问题**

因为现在仅渲染可视区域的元素，如果用户滚动过快，会出现白屏闪烁。

## 解决思路

### 1. 动态高度

1. 如何获取真实高度？
   - 如果能获得列表项高度数组，真实高度问题就很好解决。但在实际渲染之前是**很难拿到每一项的真实高度**的，所以我们**采用预估**一个高度渲染出真实 DOM，**再根据 DOM 的实际情况去设置真实高度**。
   - 创建一个缓存列表，其中列表项字段为 索引、高度与定位，并**预估列表项高度**用于**初始化缓存列表**。在渲染后根据 DOM 实际情况**更新缓存列表**。
2. 相关属性该如何计算？
   - 显然以前的计算方式都**无法使用**了，因为那都是针对固定值设计的。
   - 于是我们需要 **根据缓存列表重写计算属性、滚动回调函数**，例如列表总高度的计算可以使用缓存列表最后一项的定位字段的值。
3. 列表渲染方式有何改变？
   - 因为用于渲染页面元素的数据是根据 **开始/结束索引** 在 **数据列表** 中筛选出来的，所以只要保证索引的正确计算，那么**渲染方式是无需变化**的。
   - 对于开始索引，我们将原先的计算公式改为：在 **缓存列表** 中搜索**第一个**底部定位大于 **列表垂直偏移量** 的项并返回它的索引
   - 对于结束索引，它是根据开始索引生成的，无需修改。

### 2. 白屏闪烁

添加缓存区，整个渲染区域由 **可视区 + 缓冲区** 共同组成。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-07-02-010153.png" alt="image-20240702090152620" style="zoom:50%;" />

## 解决细节

### 1. 动态高度

**1. 预估并初始化列表**

首先增加一个 props，存储预估高度

```js
onst props = defineProps({
 	// ...
  // 预估高度
  estimatedItemSize: {
    type: Number,
    required: true
  },
 	// ...
})
```

父组件在使用该虚拟列表组件时，就需要传递这个 props：

```vue
<VirtualList :listData="data" :estimatedItemSize="100" v-slot="slotProps">
  <Item :item="slotProps.item" />
</VirtualList>
```

在虚拟列表组件里面，就需要维护一个缓存列表 postions，一开始以预估的高度来做初始化

```js
let positions = [];
// ...
const initPositions = () => {
  positions = props.listData.map((d, index) => ({
    index,
    height: props.estimatedItemSize, // 一开始以预估高度来做初始化
    top: index * props.estimatedItemSize,
    bottom: (index + 1) * props.estimatedItemSize,
  }));
};
```

**2. 更新真实数据**

每次渲染之后，需要获取 DOM 的真实高度，然后去替换 postions 里面的预估高度。

这个操作放在 Vue 里面 updated 钩子里面来处理：

```js
// 更新每一项的真实高度
const updateItemsSize = () => {
  items.value.forEach((node) => {
    let rect = node.getBoundingClientRect();
    let height = rect.height;
    let index = +node.id.slice(1);
    let oldHeight = positions[index].height;
    let dValue = oldHeight - height;
    if (dValue) {
      positions[index].bottom -= dValue;
      positions[index].height = height;

      for (let k = index + 1; k < positions.length; k++) {
        positions[k].top = positions[k - 1].bottom;
        positions[k].bottom -= dValue;
      }
    }
  });
};

// 更新偏移量
const setStartOffset = () => {
  let startOffset = start.value >= 1 ? positions[start.value - 1].bottom : 0;
  content.value.style.transform = `translate3d(0,${startOffset}px,0)`;
};

onUpdated(() => {
  requestAnimationFrame(() => {
    if (!items.value || !items.value.length) {
      return;
    }
    updateItemsSize();
    let height = positions[positions.length - 1].bottom;
    phantom.value.style.height = height + "px";
    setStartOffset();
  });
});
```

**3. 重写滚动回调**

滚动回调里面，主要是需要更新获取 startIndex 的方式。

遍历缓存列表 positions，找到第一个定位大于当前滚动距离 scorllTop 的条目，返回该条目的索引值即可。

```js
//获取列表起始索引
getStartIndex(scrollTop = 0){
  let item = this.positions.find(i => i && i.bottom > scrollTop);
  return item.index;
}

const scrollEvent = () => {
  let scrollTop = list.value.scrollTop
  start.value = getStartIndex(scrollTop) // 获取 startIndex
  end.value = start.value + visibleCount.value // 根据 startIndex 获取 endIndex
  setStartOffset()
}
```

这里有一个优化的点。postions 是一个有序的数组，因此我们在查找的时候就可以做优化。

之前用的 find：顺序查找，时间复杂度为 O(<sub>n</sub>)

因为是有序数组，可以改为二分查找，时间复杂度为 \(O(logN))

```js
const getStartIndex = (scrollTop = 0) => {
  return binarySearch(positions, scrollTop);
};

const binarySearch = (list, value) => {
  let start = 0;
  let end = list.length - 1;
  let tempIndex = null;
  while (start <= end) {
    let midIndex = parseInt((start + end) / 2);
    let midValue = list[midIndex].bottom;
    if (midValue === value) {
      return midIndex + 1;
    } else if (midValue < value) {
      start = midIndex + 1;
    } else if (midValue > value) {
      if (tempIndex === null || tempIndex > midIndex) {
        tempIndex = midIndex;
      }
      end = end - 1;
    }
  }
  return tempIndex;
};
```

### 2. 白屏闪烁

通过设置缓冲区的方式来解决。

增加一个 props 叫做 bufferScale，用于接收缓冲区数据和可视区域数据的一个比例

```js
const props = defineProps({
  // ...
  bufferScale: {
    type: Number,
    default: 1,
  },
  // ...
});
```

接下来就可以根据这个比例，计算出上下缓冲区的数量：

```js
// 上方缓冲区
const aboveCount = computed(() => {
  return Math.min(start.value, props.bufferScale * visibleCount.value);
});

// 下方缓冲区
const belowCount = computed(() => {
  return Math.min(
    props.listData.length - end.value,
    props.bufferScale * visibleCount.value,
  );
});
```

现在 visibleData 的计算也需要更新，需要加入上下缓冲区

```js
const visibleData = computed(() => {
  let startIdx = start.value - aboveCount.value;
  let endIdx = end.value + belowCount.value;
  return _listData.value.slice(startIdx, endIdx);
});
```

另外偏移量的计算也需要更新，需要将缓冲区考虑进去：

```js
const setStartOffset = () => {
  let startOffset;
  if (start.value >= 1) {
    let size =
      positions.value[start.value].top -
      (positions.value[start.value - aboveCount.value]
        ? positions.value[start.value - aboveCount.value].top
        : 0);
    startOffset = positions.value[start.value - 1].bottom - size;
  } else {
    startOffset = 0;
  }
  content.value.style.transform = `translate3d(0,${startOffset}px,0)`;
};
```

---

-EOF-

# 虚拟列表面试讲解

## 技术点图谱

涉及到的技术点如下：

- 动态高度
- 白屏闪烁
- 长列表其他解决方案
  - 时间分片

- 其他优化点

<img src="https://resource.duyiedu.com/xiejie/2024-07-07-034557.png" alt="image-20240707114557465" style="zoom:50%;" />

## 难点描述

模拟问题：我看到你项目亮点里面写了一条“优化虚拟列表的渲染”，请你说一下你具体是如何进行优化的么？

> **问题分析**
>
> 1.  当时遇到的问题？
> 2.  你拿到这个问题后，你的一个思考过程
> 3.  你思考后落地的方案
> 4.  落地方案的一个效果
>
> **参考答案**
>
> 当时我们最早那一版虚拟列表组件，因为初始需求比较固定，因此采用的是定高的方式来写的，虽然写的时候很方便，不过灵活性上面比较差，将就能用。后面由于业务需求有变化，列表项目里面会包含一些可变内容，所以之前那种定高的方案就不再可行了，这是第一个需要优化的点，支持动态高度。另外还有就是第一版虚拟列表没有设置缓冲区，在用户滚动过快的情况下，偶尔也会出现白屏闪烁的现象，这也是需要解决的一个问题。（交代问题背景）
>
> 所以我主要就是对这两个问题着手进行优化。
>
> 针对第一个问题，主要需要考虑的地方有：
>
> 1.  该如何获取真实的高度？
> 2.  和列表项相关的计算有些什么变化？
> 3.  列表渲染的方式又有什么样的变化？
>
> 而第二个问题比较简单，在可视区的基础上加上缓冲区就行了。不过添加了缓冲区后，部分计算也需要更新。添加了缓冲区后，白屏闪烁的问题就完全被解决了。（你的一个思考过程，以及你思考出来的解决方案）
>
> **当然这里面涉及到的细节还是很多的，面试老师您看需不需要我把这些细节展开讲一下。**（钩子🪝）

## 技术点描述

### 1. 动态高度

模拟问题：那你先说一下动态高度里面有哪些细节要处理？

> **问题分析**
>
> 1.  首先回答需求变为动态高度，计算方面有哪些变化
> 2.  针对这些变化你是如何思考以及如何处理的，这里在回答的时候稍微说一点细枝末节的东西
> 3.  设置下一个钩子，引到白屏闪烁的话题
>
> **参考答案**
>
> 首先列表项变为动态高度后，会存在这么一些问题：
>
> 1.  如何获取列表项的真实高度？
> 2.  和列表项高度相关的那些计算该如何变化？
> 3.  列表的渲染是否会发生变化
>
> 我刚开始考虑的第一种方案，是将列表项的高度值扩展成一个数组，数组里面包含所有的可能性，例如`[50 ,20 ,100,  ...]`
>
> 但是这种方案仍然不太好，因为说不好某个列表项的高度就不在我所设定的范围里面。
>
> 后来我又考虑能否将列表项先渲染到屏幕外，对其高度进行测量并缓存，然后再将其渲染至可视区域内。但是这样也不太好，预先渲染至屏幕外，再渲染至屏幕内，这会导致渲染成本增加一倍。（体现了你拿到这个问题后，你的一个思考过程）
>
> 最终我选择了采用预估高度先行渲染的方案，先创建一个高度缓存列表，里面存储每个列表项预估的高度值，并按照这个预估值来渲染。之后有了真实高度后，在 updated 生命周期钩子方法里面更新缓存列表里面的高度值。（你最终选择的落地方案）
>
> 不过这里涉及到一个细节，就是因为高度不定，所以获取开始索引值的方式也会有所改变。
>
> 之前定高，要获取起始索引值，直接 scrollTop 除去列表项高度就行了，现在不定高的话，起始索引的计算应该是在缓存列表中搜索第一个底部定位大于列表垂直偏移量的列表项，然后返回其索引。关于如何搜索第一个符合要求列表项，这里也有一个优化，我一开始使用的是 find 方法，但是后来我琢磨着这个缓存列表是一个有序的数组，那么使用二分查找效率会更高一些，时间复杂度相比之前的 O(<sub>n</sub>) 优化为了 O(logN)（说一些细节体现你对这个东西很熟，自然而然引出二分查找的优化，体现你的做事儿风格）
>
> **动态高度处理这一块儿的细节差不多就这么多，相比白屏闪烁那一块儿的细节确实要多一些**。（钩子🪝）

### 2. 白屏闪烁

模拟问题：那么白屏闪烁这一块儿，有一些什么细节需要处理呢？

> **问题分析**
>
> 1.  你的思考过程
> 2.  你的落地方案
> 3.  落地方案的效果
>
> **参考答案**
>
> 首先我想了想为什么会出现白屏闪烁，发现主要是因为用户滚动过快，没有给新列表项的渲染留足时间，于是我在原来列表结构的基础上，添加了缓冲区，这样整个渲染区域就由可视区+缓冲区组成。（阐述问题的原因以及你思考的一个方案）
>
> 当然，既然渲染区域的结构发生了改变，那么很多设计上面也会有相应的变动。例如我增加了一个比例值的props，方便用户调整缓冲区列表项的个数，还有就是整个列表项个数的计算，也需要将缓冲区的内容计算进去，这就涉及到两个起始和结束索引的修改。（稍微阐述一些细节，体现你对这个很熟悉）
>
> 有了缓冲区后，白屏闪烁的问题就彻底解决了，因为缓冲区的存在，有了充足的时间渲染新列表项。（最终落地的效果）

### 3. 长列表常见解决方案

模拟问题：那么除了虚拟列表以外，长列表还有其他解决方案么？

> **问题分析**
>
> 1.  首先阐述长列表的核心痛点？
> 2.  再阐述能够从哪些方面来解决这个问题？
> 3.  然后再对比一下各种方案的优缺点，突出虚拟列表是最好的（可以从虚拟列表的原理入手）
>
> **参考答案**
>
> 有倒是有，其实所有的解决方案都是为了解决长列表的核心痛点，那就是列表项过多导致的渲染耗时，性能低下，页面卡顿。（阐述长列表一个本质上的问题）
>
> 早期有一种基于时间分片的方案，例如使用 requestAnimationFrame、requestIdleCallback 这些浏览器 API，由浏览器来决定回调函数的执行时机。大量的数据会被分多次渲染，每次渲染对应一个片段。在每个片段中处理定量的数据后，就会将主线程还给浏览器，从而解决页面卡顿的问题。但是时间切片仅仅也就只能解决卡顿这个问题，你分多个时间段来渲染，渲染依然是耗时的，并且最终仍然是有大量的列表项存在于页面上，性能依然低下。（阐述时间切片这个解决方案，以及该方案有哪些缺陷）
>
> 现在比较成熟且通用的方案，基本都是用虚拟列表。这种方案的原理是设置一个可视区域，然后用户在滚动列表的时候，本质上是动态修改可视区域里面的内容，所渲染的列表项数量始终是固定的，因此同时解决了渲染耗时，性能低下和页面卡顿的问题。（从虚拟列表实现原理上来解释为什么这种方案是最好的）
>
> **当然，其实我项目里面写的第二版虚拟列表，其实还有优化的空间，回头有时间我会再写一版，然后发布到 npm 上面**。（钩子🪝）

### 4. 还有哪些优化点

模拟问题：你说还有优化的空间，具体是哪些地方呢？

> **问题分析**
>
> 回答的时候大致说一下优化的方向即可。
>
> **参考答案**
>
> 在我第二版的虚拟列表实现中，仍然用的是监听 scroll 事件的方式来触发可视区域数据的更新。但是有个问题，当滚动发生后，scroll 事件会频繁的触发，很多时候会造成重复计算的问题，这在性能上面其实是一种浪费。
>
> 这里其实可以使用 IntersectionObserver 来替换监听 scroll 事件，相比 scroll，IntersectionObserver 可以设置多个阈值来检测元素进入视口的不同程度，只在必要时才进行计算，没有性能上的浪费。并且监听回调也是异步触发的。
>
> 另外还有就是不定高这一块儿，如果列表项中包含图片，并且列表高度由图片撑开，由于图片会发送网络请求，此时无法保证在获取列表项真实高度时图片是否已经加载完成，从而造成计算不准确的情况。这种情况下，需要监听列表项的大小变化从而获取真正的高度。这里可以使用 ResizeObserver 来做这一层的监听，当尺寸发生变化后，ResizeObserver 会监听到，然后可以获取每一列表项的高度。（阐述还能够做哪些优化）
>
> 当时之所以这一块儿没有优化，是因为这两个 API 的浏览器覆盖率较低，只有极少浏览器支持这两个 API。不过现在这两个 API 的支持度已经比较好了，可以考虑替换以前的一些做法了，当然，我也会考虑回退机制，从而支持低版本的浏览器。（解释为什么之前没有用这个优化方案，顺便说要考虑回退机制，体现你的做事儿风格）
>
> 不知道这一块儿我还有没有没考虑完善的地方，面试老师您认为还有其他需要优化的地方么？
>
> （结束🎉）

---

-EOF-
