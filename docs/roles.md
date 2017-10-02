# upgrader #

Upgrades controller structure. Does not like to move and asks servitors to bring him resources

needs: servitor, miner
provides: controller_upgrader

# Worker #

body = WORK:1,CARRY:2,MOVE:2

Does all the stuff until t2 and corporation development

States:
Mining - mines resources untill full. Skip mining if logistics center is available
Feeding - feed spawn and extensions
Building - build any available building. 
Upgrading - upgrades controller. Skip upgrading if corporation is active

Typical life:

1. Mine something
2. Do job:
	- feed spawn
	- build
	- upgrade

# servitor #

Typical life:

1. pick nearest'want drop' task
2. move to specified point and pick energy
3. find nearest 'feedme' task 
4. if not full:
5.		find nearest 'wantdrop' task
6.		if 'wantdrop' is closer: goto 2
7. move to specified 'feedme'

# Upgrader #

1. Move to upgrading spot
if res < 50%
	if this.corp
		pick this.corp.container
	
upgrade
