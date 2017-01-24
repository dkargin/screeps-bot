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


Goal(Upgrade4)
	Need (uenergy +200)

UpgradeTick
	Need: (Upgrader((near controller);(energy 50))
	Occupies: (Upgrader)
	Provides: (uenergy +50), (Upgrader(near controller))

Build upgrader_mk1
	Need: Spawn(rez>=300)
	Occupies: Spawn
	Provides: Upgrader*(near spawn), Spawn(res-=300)

Build mover_mk1
	Need: Spawm(res >= 100)
	Occupies: Spawn
	Provides: Mover(res = 0), Spawn(res -= 100)

Build mover_mk2
	Need: Spawm(res >= 300)
	Occupies: Spawn
	Provides: Mover(res = 0), Spawn(res -= 300)

Build miner_mk1
	Spawm(res >= 300)
	Occupies: Spawn
	Provides: Mover(res = 0), Spawn(res -= 300)

Move creep (target):
	Need: creep, ...

Pick rez
	Need: ...
	Provides: ...

Dump res
	Need: ...
	Provides: ...

Mine res:
	Need: Creep, 
	Provides:

# Problems #

1. Harvester MoveTo ordered cases when target is available directly