# Task/Action system design #

Requirements

- 'task' should have ability to restore its state from memory (global factory + restore function). Should it store full state in mem, or split it to memory and cache?
- actions can raise events on_complete, on_start. How can behaviour controller resture such event links?
- How about generators?


class Action
{
	on_complete = external callback
	on_failed = external callback	
}

Every object with task queue should have:
- memory.actions = {ActionName:ActionData}
- memory.queue = [ActionName1, ActionName2, ...]

/** Removes action from the queue
 */
action_remove(index)
{
	remove from queue
	remove from actions
}

/// Reenterable function example
/// 'switch' allows to jump to specific state based on cached memory state
async_mine = function*(creep, target)
{
	try
	{
		switch(this.memory.state)
		{
		case Move:
			result = yield creep.async_move(target)
			this.memory.state = Mine
		case Mine:
			result = yield creep.async_harvest(target)
			this.memory.state = Return
		case Return:
			result = yield creep.async_move(target)
		}
	}
	catch(ex)
	{
		/// Catch interrupt
	}
	return
}

Creep.prototype.process_async = function()
{
	
}

creep.async_move = function * (target)
{
}


# Notable threads #

Per-room tasks:
	- check_room_tasks - checks whether room logistic tasks are valid
	- control_towers - control room towers

Global tasks:
	- check_memory - collect garbage
	- 
