# upgrader #

Upgrades controller structure. Does not like to move and asks servitors to bring him resources

needs: servitor, miner
provides: controller_upgrader

# servitor #

Typical life:

1. pick nearest'want drop' task
2. move to specified point and pick energy
3. find nearest 'feedme' task 
4. if not full:
5.		find nearest 'wantdrop' task
6.		if 'wantdrop' is closer: goto 2
7. move to specified 'feedme'



provides: servitor