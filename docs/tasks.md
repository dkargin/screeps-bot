# Task/Action system design #

Requirements

- actions should have ability to restore its state from memory (global factory + restore function)
- actions can raise events on_complete, on_start. How can behaviour controller resture such event links?


class Action
{
	on_complete = external callback
	on_failed = external callback
	
}

