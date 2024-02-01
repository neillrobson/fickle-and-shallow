# Fickle and Shallow
#### Empirical Discovery of Joyful State Management

Hi! I'm Neill Robson. Today I'll be discussing some unique programming patterns that I found make Vuex a bit nicer to use at large scales.

---
## Agenda

This talk is special, because when I submitted the proposal, I hadn't learned any of the information yet. The talk was an excuse to run some experiments and present the results.

So the agenda reflects that: I'll talk a bit about what inspired me, explain how I messed around with Vuex, and then finish up with some learnings and takeaways.

	1. Motivation
	2. Experiment Setup
	3. Findings
	4. Takeaways

---
/assets/hacky.png
size: contain
## Motivation

How many of you have ever interacted with Pendo guides inside Vuex? Keep your hand raised if you remember the experience fondly.

I thought so.

At large scales, Vuex state management is a nightmare. The Vuex modules for guides are nearly fourteen hundred lines long, and chock full of comments like "disgusting hack alert" Or "we intend to fix this ASAP" with a five-year-old Git blame.

It's no surprise we're terrified to touch that thing. The smallest change could update fields you never intended to modify, or worse, grind the application to a halt as the entire UI attempts to re-render.

I felt that there must be a better way.

---
## How We Got Here

I imagine many of us immediately put up defenses when we hear someone at a podium complain about code we contributed to. Let me assure you that, of the sinners, I am chief among them. You might relate with a few of these stories:

---
/assets/cargo-cult.jpg

### Cargo Cult Programming

In the name of readability and consistency, I copy a pattern I see elsewhere in our Vuex codebase into a new action--usually without any understanding of how it works. This practice is also known as cargo cult programming.

---
### Oversimplified Examples

I don't know what to do, so I go online and I read some blogs and Stack Overflow snippets for recommendations. Inevitably, the example uses a To-Do List as the state, an array with three primitive items whose total space on disk isn't more than half a kilobyte. In other words, completely inapplicable to our customers' massive guide lists.

/assets/simple-app.png
filter: blur

---
### Deadlines
/assets/deadline.png
size: contain

I figure out something that seems to work, and the sprint is ending tomorrow, and who knows where I could get a clean environment for performance testing, and frontend devs never do that sort of stuff anyway, so what the heck? Merge it.

---
## Back to Basics

I experienced a string of embarrassing code reviews and bug reports spiraling from these practices. At the same time, I wasn't really learning any lessons. Talented senior engineers would give me better ways to manage state, I'd implement it blindly, and promptly forget the code.

I wanted to mess around on my own: write some Vuex code, run some numbers, and let the data tell me what the best practices really are.

So, I wrote a Minicon proposal as if I knew the answers, and then took the majority of the prep time to run my experiments!

---
## The Problem

Most of our guide and resource center Vuex problems take the same form:

/assets/announcements.png

- Loop over some random objects in a large map
- Update a deeply-nested field in each
- Calling an API to determine each updated field value
- While the UI watches and re-renders on changes.

---
## The Goals

Like most software engineers, I want to optimize three traits of the system:

	- Maximize reliability
	- Minimize runtime
	- Minimize storage space

---
## Experiment Setup
### Dependencies
	- Vue
	- Vuex
	- CoreJS
	- Lodash
	- @pendo/components

I constructed a simple Vue 2 sandbox environment for all of the tests. The dependencies were kept as minimal as possible.

/assets/github-qr.png
size: contain
	https://github.com/neillrobson/fickle-and-shallow

---
## Experiment Setup
### Dependencies
	- Vue
	- Vuex
	- CoreJS
	- Lodash
	- **@pendo/components**
/assets/UI.png

The component library was pulled in only to make the experiment site pretty... and also to make it look a bit more like I was doing real work while preparing this presentation.

/assets/github-qr.png
size: contain
opacity: 80%
	https://github.com/neillrobson/fickle-and-shallow

---
## Data Generation

/assets/data.png
size: contain

If I just started with an empty map in my Vuex module, I'd be no better than the Stack Overflow snippets I condemned at the start of this presentation.

To make my initial data set as unwieldy as possible, I wrote a script to generate a variable-sized map of objects. You can see an example on the screen. Using this generator, I could hydrate my Vuex module with a map of about ten thousand objects, each with around one hundred (numeric) fields.

So the state map is taken care of, but how to we simulate a heavyset UI as well?

---
## Watch Me

/assets/watchers.png
size: contain


The most important and inefficient trait of a big UI is a lot of watchers on the state. The Composition API happened to be surprisingly useful for creating dozens of deep watchers on the same map object, along with shallow watchers over sequential ranges of keys.

---
## Time to Crash

With that, the stage was set. It was time to crash the browser.

If you recall, my goals were to find patterns that maximized reliability, and minimized runtime and heap usage in the browser. After profiling a couple dozen variations of the looped field-change operation, I observed several surprising patterns that led to positive results.

---
## The Patterns

I'd summarize them as follows:

	- Stay out of the loop
	- Keep it surface-level
	- Make empty promises

Needless to say, Vuex is quite an unusual partner to dance with. Let's dig into each of these briefly:

---
/assets/ex-dispatch.png
size: contain
## Stay Out of the Loop

My first broad curiosity was the impact of how "the loop" was constructed: what bits of code were inside or outside the iterator that ultimately made changes to each field.


/assets/in-dispatch.png
size: contain



Should the loop be inside an action, or inside a mutation? Or perhaps the loop should be outside, iteratively dispatching an action or committing the mutation. Where should the waiting occur for any asynchronous tasks?

---
#### Stay Out of the Loop
## Data

Profiling each of these combinations separately yielded satisfyingly consistent results. There's a lot of data on the screen, but hopefully you can even see the patterns arising between the orders of magnitude for several values.

Idle time (simulated API calls) was subtracted from the relevant values. However, I did not subtract the overhead of continually stalling the thread.

Let's drill down a little bit with some averages.

| Dispatch / Commit | Internal / External | Include Timeouts | Runtime (ms)[^Minus idle time] | Max Heap (MB) |
| ----------------- | ------------------- | ---------------- | ------------------------------ | ------------- |
| Dispatch          | External            | TRUE             | 10403                          | 450           |
| Dispatch          | External            | FALSE            | 9688                           | 443           |
| Dispatch          | Internal            | TRUE             | 10164                          | 452           |
| Dispatch          | Internal            | FALSE            | 9350                           | 447           |
| Commit            | External            | TRUE             | 3786                           | 425           |
| Commit            | External            | FALSE            | 253                            | 115           |
| Commit            | Internal            | TRUE             | 4280                           | 445           |
| Commit            | Internal            | FALSE            | 219                            | 128           |


---
#### Stay Out of the Loop
## Data

| Type     | Runtime (ms) | Max Heap (MB) |
| -------- | ------------ | ------------- |
| Dispatch | 9901         | 448           |
| Commit   | 2135         | 278           |

Averaging the runtimes and heap sizes of the dispatch strategies vs commit strategies, we can see that mutations are the clear winner.

The tradeoff, of course, is that you must keep any asynchronous tasks outside the mutation.

/assets/ex-commit.png
size: contain

---
#### Stay Out of the Loop
## Data
/assets/lift-timeouts.png
size: contain

| Async?      | Runtime (ms) | Max Heap (MB) |
| ----------- | ------------ | ------------- |
| Interleaved | 7158         | 443           |
| Lifted      | 4878         | 283           |

In fact, by moving the asynchronous tasks outside the loop entirely (into pre-processing), runtime and memory usage drop consistently: even if you choose to use actions over mutations.

---
#### Stay Out of the Loop
## Lessons

	- Keep async in preprocessing
	- Mutations over actions?
		- Not always: share the thread

The numbers spoke clearly that the *location* of the `for` loop itself (inside or outside a Vuex module) made little difference. Vue's optimization engine handled that variable well. However, keeping asynchronous operations out of the loop, whether that be API calls or dispatches, yielded a clear advantage.

Which begs the question... if raw mutations are so efficient, why use actions at all?

---
### Share the Thread

/assets/share-the-thread.png
size: contain

One benefit of the occasional `await` is that it gives other jobs--such as reactive updates and animations--time to catch up. Sure, raw mutations with no looped API calls ran in the blink of an eye. However, when pushed to extremes (update counts in the hundreds or thousands), I found that the entire UI would become completely frozen during the seconds of processing. On the other hand, some of the "slower" alternatives would take longer to complete, but leave the UI functional during the job.

---
/assets/clone-deep-grimace.png
size: contain
## Keep It Surface Level

When the loops still get too big, a common alternative is to clone the map in advance, do all your operations on the clone, and then fire off a single commit that just resets the map. It triggers the shallow watchers that might otherwise miss the update, and it supposedly runs more efficiently.

---
#### Keep It Surface Level
## Data

The assumption seems reasonable--one big clone rather than multiple reactive cascades--but the data said otherwise.

| Type                                             | Clone                 | Runtime (ms) | Max heap (MB) | Deep watch # |
| ------------------------------------------------ | --------------------- | ------------ | ------------- | ------------ |
| Multi commit[^Baseline from previous experiment] | None                  | 39670        | 94.6          | 100          |
| Single commit                                    | Deep                  | 819          | 117           | 1            |
| Single commit                                    | Shallow               | 511          | 93.4          | 1            |
| Single commit                                    | None (loop in commit) | 490          | 77.6          | 1            |

Certainly, all of the single-commit options (where we do all the processing in advance) have a much better runtime than the multi	-commit solution. However, the overhead of cloning consistently yielded slightly worse runtimes. Cloning also didn't make any difference for how frequently the watchers fired: once again, Vuex collapsed the updates into a single reaction.

---
#### Keep It Surface Level
## Grasping at Straws

I showed these initial results to Jordana. I didn't want to be presenting flawed numbers to the company, after all. And I had been called out for *not* cloning in the past. She suggested many follow-on experiments:

	- Increase map depth
	- Eliminate timeouts
	- Mutate more of the map
	- Add more deep watchers

Again and again, though the numbers would fluctuate slightly, the trend was clear: *any* sort of cloning strategy introduced more runtime overhead than it removed in the reactive cascade process.

---
#### Keep It Surface Level
## Lessons
/assets/mutations.png
size: contain

	- Just edit the map[^in a mutation, of course]
	- Shallow clone over deep clone

So, I came to the surprising conclusion that, for the most part, you just want to edit the map directly--in a mutation, of course.

There are still certainly benefits to cloning on occasion--if unchangeable shallow watchers are involved, for example--but even there, a shallow clone is all you need. It's cheaper in both space and runtime, and Vue is smart enough to clear out the duplicate reactive metadata.

But in most situations, a single mutation, wrapping however many data changes you need, is best. Do your pre-processing in advance, then call the mutation: keep the commitment surface-level.

---
## Make Empty Promises

==TODO==: Discussion of loading promise map **if time permits**!

https://medium.com/js-dojo/a-trick-up-vuexs-sleeve-promises-and-weakmaps-a7629042399b

---
## Takeaways

	- Vuex is smarter than we thought
	- Process twice[^or as much as you need], commit once
	- Empiricism over dogma

So what did I learn after all of that fooling around? Aside from my tongue-in-cheek design patterns, I've learned a few things:

First, Vue and Vuex are a lot better optimized than I assumed. Any time I made a loop in the past, I was terrified of putting it anywhere close to a Vuex action or mutation. But it turns out that Vuex does good bookkeeping behind the scenes.

Asynchronous tasks are really what we should be scared of inside a loop, especially one also interacting with Vuex. If you can keep that part of processing before your state changes, chances are you'll have a good foundation for performant state management.

Finally, I learned how easy it is to spin up a sandbox to learn from experience. You don't need a minicon or hackathon to justify making a quick NPM project. Next time you question whether a design pattern is appropriate, try answering your own question empirically! You'll add to your team's wisdom, and have a lot of fun as well.

---
## Thank you
### Questions?
