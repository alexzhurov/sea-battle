import './sass/main.scss'

/*////////////////////////////////////////////
////
*/////////////////////////////////////////////
$(function () {
  /*////////////////////////////////////////////
  //// store
  */////////////////////////////////////////////
  var store = {
    userName  : '',
    enemyName : '',
    phase     : 'start', // start, combat, result
    step      : 1,
    ships     : [],
    fields    : {},
  }

  /*////////////////////////////////////////////
  //// View
  */////////////////////////////////////////////
  var view = {
    showPlayer : function () {
      // get players names
      store.userName = $('#user_name_input').val()
      store.enemyName = $('#enemy_name_input').val()
    },
    showStep   : function () {
      //render step info
      $('#step_number').html('Ход - ' + store.step)
      $('#step_owner').html('Ходит - ' + store.userName)
    },
    startFight : function () {
      store.phase = 'combat'
      $('#screen_start').toggleClass('hidden')
      $('#screen_combat').toggleClass('hidden')
    },
  }
  /*////////////////////////////////////////////
  //// Model
  */////////////////////////////////////////////
  var model = {
    shot           : function () {

    },
    createShip     : function (len, owner) {
      var ship = {}

      ship.owner = owner
      ship.len = len
      ship.isVertical = getRandom(1)
      // generate ship position
      if (ship.isVertical) {
        ship.x = getRandom(9)
        ship.y = getRandom(10 - len)
      } else {
        ship.x = getRandom(10 - len)
        ship.y = getRandom(9)
      }

      // проверяем валидность координат всех палуб корабля:
      // нет ли в полученных координатах или соседних клетках ранее
      // созданных кораблей
      var isValid = this.checkShipCoord(ship)
      console.log('isValid: ', isValid)
      console.log('ship: ', ship)

      // если координаты повторяются, снова запускаем функцию
      if (!isValid) return this.createShip(len, owner)
      store.ships.push(ship)
      this.locateShip(ship)
    },
    checkShipCoord : function (ship) {
      var fromX, toX, fromY, toY
      // проверяем начальную позицию

      // задаём начальную и конечную координаты площади занимаемую кораблём
      // если х корабля = 0, значит корабль примыкает к верхнему краю поля
      // и значит х площади, тоже начинается с нуля
      fromX = (ship.x === 0) ? ship.x : ship.x - 1
      // если корабль расположен  вертикально
      // и конец корабля примыкает к нижнему краю
      // и значит toX площади, тоже заканчивается координатой конца корабля
      if (ship.x + ship.len === 10 && ship.isVertical) {
        toX = ship.x + ship.len
      }
      // если корабль расположен  вертикально
      // и конец корабля НЕ примыкает к нижнему краю
      // тогда toX площади примыкает, больше координаты конца корабля на 1
      else if (ship.x + ship.len < 10 && ship.isVertical) {
        toX = ship.x + ship.len + 1
      }
      // если корабль расположен  горизонтально вдоль нижней границы поля
      else if (ship.x === 9 && !ship.isVertical) {
        toX = ship.x + 1
      }
      // если корабль расположен  горизонтально
      // и не примыкает к краю поля
      else if (ship.x < 9 && !ship.isVertical) {
        toX = ship.x + 2
      }
      // задаём начальную и конечну Y координату площади
      fromY = (ship.y === 0) ? ship.y : ship.y - 1
      if (ship.y + ship.len === 10 && !ship.isVertical) {
        toY = ship.y + ship.len
      } else if (ship.y + ship.len < 10 && !ship.isVertical) {
        toY = ship.y + ship.len + 1
      } else if (ship.y === 9 && ship.isVertical) {
        toY = ship.y + 1
      } else if (ship.y < 9 && ship.isVertical) {
        toY = ship.y + 2
      }

      // запускаем циклы и проверяем координаты площади
      // если значение равно 1му, значит ячейка занята
      for (var i = fromX; i < toX; i++) {
        for (var j = fromY; j < toY; j++) {
          if (store.fields[ship.owner][i][j] === 1) return false
        }
      }
      return true
    },
    locateShip     : function (ship) {
      var field = store.fields[ship.owner]
      // Записываем координаты корабля в поле владельца( owner)
      for (var i = 0; i < ship.len; i++) {
        if (ship.isVertical) {
          store.fields[ship.owner][ship.y + i][ship.x] = 1
        } else {
          store.fields[ship.owner][ship.y][ship.x + i] = 1
        }
      }
      store.fields[ship.owner] = field

    },

    createField : function (owner) {
      var x = 10, y = 10, arr = [10]
      for (var i = 0; i < x; i++) {
        arr[i] = [10]
        for (var j = 0; j < y; j++) {
          arr[i][j] = 0
        }
      }
      store.fields[owner] = arr
    },
  }
  /*////////////////////////////////////////////
  //// util functions
  */////////////////////////////////////////////

  function getRandom(n) {
    // n - максимальное значение, которое хотим получить
    return Math.floor(Math.random() * (n + 1))
  }

  model.createField('user')
  model.createShip(4, 'user')
  model.createShip(3, 'user')
  model.createShip(3, 'user')
  model.createShip(2, 'user')
  model.createShip(2, 'user')
  model.createShip(2, 'user')

  console.log('state.fields.user: ', store.fields.user)
  console.log('state.ships: ', store.ships)

  $('#start_form').submit(function (event) {
    event.preventDefault()
    // get players names
    store.userName = $('#user_name_input').val()
    store.enemyName = $('#enemy_name_input').val()
    //render players names
    $('.description-user').html('Игрок - ' + store.userName)
    $('.description-enemy').html('Противник - ' + store.enemyName)
  })
})

// (function (w, h) {
//   var p1map = [
//     '~ss~~~~s~~',
//     '~~~~~~~~~~',
//     '~~~~s~~~~s',
//     '~s~~~~s~~s',
//     '~s~~~~s~~s',
//     '~s~~~~~~~~',
//     '~~~~~~~~s~',
//     '~~~~ss~~~~',
//     '~s~~~~~~~~',
//     '~~~~ssss~~',
//   ]
//   var p2map = [
//     '~~~s~~~~ss',
//     '~s~s~~~~~~',
//     '~~~s~~~~~~',
//     '~~~s~~~s~~',
//     '~~~~~~~s~~',
//     '~s~~s~~s~~',
//     '~s~~~~~~~~',
//     '~s~s~~~~~~',
//     '~~~~~ss~~~',
//     'ss~~~~~~s~',
//   ]
//   var p1 = document.querySelector('#p1'),
//       p2 = document.querySelector('#p2')
//
//   for (i = 0; i < w; i++) for (j = 0; j < h; j++) {
//     div1 = document.createElement('div')
//     div1.id = i + '_' + j,
//       div1.className = p1map[i][j] == 's' ? 's' : 'w'
//     p1.appendChild(div1)
//     div2 = document.createElement('div')
//     div2.className = p2map[i][j] == 's' ? 's' : 'w'
//
//     div2.onclick = function () {
//       if (fire(this)) backfire()
//     }
//     p2.appendChild(div2)
//   }
//
//   function fire(el) {
//     if (el.className == 'd' || el.className == 'm') return false
//     el.className = el.className == 's' ? 'd' : 'm'
//     if (document.querySelectorAll('#p2 .s').length === 0) {
//       alert('You have won!')
//       return false
//     }
//     if (el.className == 'm') return true
//   }
//
//   function backfire() {
//     for (i = w * h; i > 0; i--) {
//       var targets = document.querySelectorAll('#p1 .s, #p1 .w')
//       if (targets.length === 0 || fire(targets[Math.floor(Math.random() * targets.length)])) break
//     }
//     if (document.querySelectorAll('#p1 .s').length === 0) alert('You have lost!')
//   }
// })(10, 10)
