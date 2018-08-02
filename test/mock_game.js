// Contains placeholder definitions for game classes

global.Memory = 
{
	settings: {os_log_html: false}
}

var Game = {
	time:0,
	objects:{},
	rooms:{},
}

Game.time = 0
Game.cpu = 
{
	limit:10,
	getUsed:function()
	{
		return 0
	}
}

Game.getObjectById = function(id)
{
	return Game.objects[id]
}

var lastObjectId = 1

function registerObject(obj)
{
	Game.objects[lastObjectId] = obj
	obj.id = lastObjectId
	lastObjectId++
}

global.Creep = class {}
global.Flag = class {}


global.Room = class
{
	constructor(name, objects)
	{
		this.name = name
		Game.rooms[name] = this
		if ('mines' in objects)
		{
			for(let i in objects.mines)
			{
				var mineDesc = objects.mines[i]
				var obj = new Source(mineDesc.pos[0], mineDesc.pos[1], name, mineDesc.res)
				registerObject(obj)
			}
		}
	}
}

global.RoomPosition = class
{
	constructor(x, y, room)
	{
		this.x = x
		this.y = y
		this.room = room
	}
}

global.RoomObject = class
{
	constructor(x, y, room)
	{
		this.pos = new RoomPosition(x, y, room)
	}
}

global.Source = class extends RoomObject
{
	constructor(x, y, room, res)
	{
		super(x, y, room)
		this.res = res
	}
}

global.Spawn = class extends RoomObject
{
	constructor(x, y, room)
	{
		super(x, y, room)
	}
}

global.StructureContainer = class extends RoomObject
{
}

global.Game = Game
