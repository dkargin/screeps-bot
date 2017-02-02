# Mining thoughts #

Добывающий инструмент

Шахта восстанавливается за 300 тиков. Вместимость шахты 4000/3000/1500. Рука копает 2 за тик. Значит нужно 4000/(2*300) = 7 рук чтобы полностью скушать шахту за один цикл

work=1, store=2, move=2, 2 ticks per move
work=2, store=1, move=1, s=4, 2 ticks per move

Добывает 25 тиков (роняет 2 ресурса), передвигается до дома 2*distance

# Способы добычи #
- копаем-возвращаем. Элементарный способ, доступный в самом начале
- копаем в склад. Стоим прямо на складе, майним-роняем. Можно ли тем же копателем чинить?

Время постройки склада - 4000/(5*WORK) = 800/WORK при наличии ресурсов
Время на добычу 4000energy = 4000/(2*work) = 2000/WORK

Итого: 2000/WORK + 800/WORK = 2800/WORK. При WORK=1 получаем "две жизни юнита"

res_per_move = store*50
ticks_per_move = (2*(work+store+move)-move)/2*move = (2*(work+store)+move)/2*move = 1/2+(work+store)/move

cycle_time_total = 2*move_time + mine_time
mine_time = 50*store / (2*work) = 25*store/work
move_time = distance * ticks_per_move

cycle_time_total = 2*distance*(1 + 2(work+store)/2*move) + 25*store/work

miner_income_rate(distance, work, store, move) = (res_per_move/cycle_time_total) =  50*store / (2*distance*(1 + 2(work+store)/move) + 25*store/work) 
miner_income_rate(distance, work=2, store=1, move=1) = 50 / (2*distance(1+2(2+1)/1) + 25/2) = 100 / (4*distance*7 + 25)

miner_income_rate(distance=0, work, store, move) = 50 / (2*distance(1+2(2+1)/1) + 25/2) = 100 / (4*distance*7 + 25)

mover_income_rate(distance, store=1, move=1) = (res_per_move/cycle_time_total) = 50*store / (2*distance*(1 + 2*store/move))
mover_income_rate(distance, store=3, move=3) = 2*work 

