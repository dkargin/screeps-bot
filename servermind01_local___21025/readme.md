Шахта восстанавливается за 300 тиков. Вместимость шахты 4000/3000/1500. Рука копает 2 за тик

Значит нужно 4000/(2*300) = 7 рук чтобы полностью скушать шахту

Mover types

1. Feed spawn. Takes
	StateFindLoad: 
		- target = find(STORAGE, storage.feed_spawn() == true && available-reserved > 0)
		- this.reserve = storage.reserve(this.max_carry)
		- switch to StatePick
	StateMoveLoad: 
		- move to target every N iterations
		- if arrived:
			- pick energy
			- storage.reserve(-this.reserve)
			- switch to StateFindUnload
	StateFindUnload:
	    - if no target:
	    	- target = find(SPAWN|EXTENSION, target.stored < target.max, this.limits)
	    - if target:
	    	- switch to StateMoveUnload
	StateMoveUnload:
		- move to target, every N iterations
		- if arrived:
			- transfer
		- if have more:
			switch to
		- if this.is_old()
			switch to StateMoveRenew()


	StateMoveRenew: moving to renew age counter
		- move to spawn
		- if arrived:
		    - transfer for renew
		    - ask spawn for renew with specified cost

2.


ticks = 1200 / (600/body_size) = body_size / 2

total = body_cost / 5

Неправильно определяется число текущих юнитов по рецепту + количество в очереди