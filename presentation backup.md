# Fickle and Shallow
#### Empirical Discovery of Joyful State Management

Hi! I'm Neill Robson. Today I'll be discussing some counterintuitive practices to make Vuex a bit more bearable in enterprise environments.

---
## ==TODO== Agenda

We should probably say something about how this presentation is uniquely empirical.

	1. Motivation
	2. Experiment Setup
	3. Findings
	4. Takeaways

---
## Motivation

How many of you have ever interacted with Pendo guides inside Vuex? Keep your hand raised if you remember the experience fondly.

I thought so.

At large scales, Vuex state management is a nightmare. The Vuex modules for guides are nearly fourteen hundred lines long, and chock full of comments like "use the hacky implementation in the else statement" Or "we intend to fix this, but for now..." Of course, the Git blame for those comments is half a decade ago.

It's no surprise we're terrified to touch that thing. The smallest change could update fields you never intended to modify, or worse, grind the application to a halt as the entire UI attempts to re-render.

It doesn't have to be that way.

---
## How We Got Here

I imagine many of us immediately put up defenses when we hear someone at a podium complain about code we contributed to. Let me first assure you that, of the transgressors, I am chief among them. The road to darkness was paved with good intentions:

- In the name of readability and consistency, I copy a pattern I see elsewhere in our Vuex codebase into a new action--usually without any understanding of how it works. This practice is also known as cargo culting.
- I don't know what to do, so I go online and I read some blogs and Stack Overflow snippets for recommendations. Inevitably, the example uses a To-Do List as the state, an array with three primitive items whose total space on disk isn't more than half a kilobyte. In other words, completely inapplicable to our customers' massive guide lists.
- I see something that works, and the sprint is ending tomorrow, and who knows where I could get a clean environment for performance testing, and frontend devs never do that sort of stuff anyway, so what the heck? Merge it.

---
## Back to Basics

After a string of embarrassing code reviews and bug reports spiraling from these practices, I decided to go back to high-school basics: that's right, the scientific method. Let's make some hypotheses, eliminate the confounding variables, and let the data tell us what the best practices actually are when our Vuex state map is ==too large to fit on a compact disc==.

A couple of Mythbusters-style browser explosions wouldn't hurt, either.

---
## The Problem

In my case, I wanted specifically to bulk-update the launch method of all announcements in a module, keeping the guide list state in sync.

Lest that problem sounds too domain-specific, we can generalize:

- Update a deeply-nested field in dozens of elements
- Distributed among a map of potentially thousands of items
- Calling an API to determine each updated field value
- While an inordinate number of components watch the state map.

---
## The Goals

Like most software engineers, I want to optimize three traits of the system:

	- Maximize reliability
	- Minimize runtime
	- Minimize storage space

Any self-respecting scientist would say that's too many variables, none of them are stated as questions, and all of them are too vague. To which I would respond: I'm a software engineer, not a scientist.


---
## Experiment Setup

/assets/github-qr.png
size: contain

I constructed a simple Vue 2 sandbox environment for all of the tests. The dependencies were kept as minimal as possible:

	- Vue
	- Vuex
	- CoreJS
	- Lodash
	- @pendo/components

The component library was pulled in only to make the experiment site pretty... and also to make it look a bit more like I was doing real work while preparing this presentation.

	https://github.com/neillrobson/fickle-and-shallow


---
## Data Generation

If I just started with an empty map in my Vuex module, I'd be no better than the Stack Overflow snippets I condemned at the start of this presentation.

To make my initial data set as unwieldy as possible, I wrote a script to generate a variable-sized map of objects. Object keys were sequential alphabetic identifiers similar to Excel column addresses. Using this little generator, I could hydrate my Vuex module with a map of about ten thousand objects, each with around one hundred (numeric) fields.

---
## Watch Me

If a tree falls in a forest, and nobody is around to watch it, it didn't happen--at least, not from Vue's perspective. The Composition API happened to be surprisingly useful for creating dozens of deep watchers on the same map object, along with shallow watchers over sequential ranges of keys.


---
## The Atomic Change
### ...a Collatz iteration

I needed some simple but meaningful "base change" to run dozens of times over individual fields in the map's objects. Incrementing struck me as a bit too predictable, so I chose to run an iteration of the Collatz conjecture for each modified field.

Additionally, when needing to mock asynchronous calls for a given change, I used a simple `setTimeout` Promise to slow that operation down.


---
## Time to Crash

With that, the stage was set. It was time to crash the browser.

If you recall, my goals were to find patterns that maximized reliability, and minimized runtime and heap usage in the browser. After implementing and measuring a couple dozen variations of the looped field-change operation, I observed several surprising patterns that led to positive results:

---
## The Patterns

	- Stay out of the loop
	- Keep it surface-level
	- Make empty promises

Needless to say, Vuex is quite an unusual partner to dance with. Let's dig into each of these briefly:


---
## Stay Out of the Loop

My first broad curiosity was the impact of how "the loop" was constructed: what bits of code were inside or outside the iterator that ultimately called the Collatz operator sequentially on each field.

Should the loop be inside an action, or inside a mutation? Or perhaps the loop should be outside, iteratively dispatching an action or committing the mutation. If the operation has an asynchronous component, where should the waiting occur?

---
## Stay Out of the Loop

Profiling each of these eight combinations separately yielded satisfyingly consistent results. Idle time (simulated API calls) was subtracted from the relevant values, but not the overhead of continually stalling the thread.

You'll also notice I don't include any data on the accuracy of the results. Short of reactive update collapsing (a performance boost when it happened), the data impact of each alternative was identical.

| Dispatch / Commit | Internal / External | Include Timeouts | Runtime (ms) | Max Heap (MB) |
| ----------------- | ------------------- | ---------------- | ------------ | ------------- |
| Dispatch          | External            | TRUE             | 10403        | 450           |
| Dispatch          | External            | FALSE            | 9688         | 443           |
| Dispatch          | Internal            | TRUE             | 10164        | 452           |
| Dispatch          | Internal            | FALSE            | 9350         | 447           |
| Commit            | External            | TRUE             | 3786         | 425           |
| Commit            | External            | FALSE            | 253          | 115           |
| Commit            | Internal            | TRUE             | 4280         | 445           |
| Commit            | Internal            | FALSE            | 219          | 128           |

---
## Stay Out of the Loop

	- Keep async in preprocessing
	- ...Mutations over actions?
		- Not always: share the thread

The numbers spoke clearly that the *location* of the loop (inside or outside a Vuex module) made little difference due to Vue's optimizing capabilities. However, keeping asynchronous operations out of the loop, whether that be API calls or dispatches, yielded a clear advantage.

Which begs the question... if raw mutations are so efficient, why use actions at all?

One benefit of the occasional `await` is that it gives other jobs--such as reactive updates and animations--time to catch up. Sure, raw mutations with no looped API calls ran in the blink of an eye, but when pushed to extremes (update counts in the hundreds or thousands), the entire UI would become completely unresponsive during the seconds of processing. On the other hand, some of the "slower" alternatives would take longer to complete, but leave the UI functional during the job.


---
## Keep It Surface Level

When the loops still get too big, a common alternative is to clone the map in advance, do all your operations on the clone, and then fire off a single commit that just resets the map. It triggers the shallow watchers that might otherwise miss the update, and it supposedly runs more efficiently.

The assumption seems reasonable--one big clone rather than "n" reactive cascades--but the data said otherwise.

==TODO==: Data here!

---
## Grasping at Straws

I showed these initial results to Jordana. I didn't want to be presenting flawed numbers to the company, after all. She suggested many follow-on experiments:

	- Increase the depth of the map
	- Just clone/change the reference head
	- Mutate a larger percentage of the map
	- Increase the number of deep watchers

Again and again, though the numbers would fluctuate slightly, the trend was clear: *any* sort of cloning strategy introduced more runtime overhead than it removed in the reactive cascade process.

---
## Keep it Surface Level

	- Shallow clone over deep clone
	- ...just change the data

There are still certainly benefits to cloning on occasion--if unchangeable shallow watchers are involved, for example--but even there, a shallow clone is all you need. It's cheaper in both space and runtime, and Vue is smart enough to clear out the duplicate reactive metadata.

But in most situations, a single mutation wrapping however many data changes you need consistently performs best. Do your pre-processing in advance, then call the mutation: keep the commitment surface-level.

---
## Make Empty Promises

==TODO==: Discussion of loading promise map **if time permits**!


---
## Takeaways

	- Vuex is smarter than we thought
	- Process twice[^or as much as you need], commit once
	- Empiricism over dogma


---
## Thank you
