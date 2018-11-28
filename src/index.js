import './sass/main.scss'

$(function () {
  /*////////////////////////////////////////////
  //// store
  */////////////////////////////////////////////
  var store = {
    userName  : '',
    enemyName : '',
    step      : 1,
    fields    : {
      user     : null,
      computer : null,
    },
    series    : [ // стандартный набор кораблей
      { size : 4, amount : 1 },
      { size : 3, amount : 2 },
      { size : 2, amount : 3 },
      { size : 1, amount : 4 },
    ],
    caption   : {
      axisX : ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'],
      axisY : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
  }

  /*////////////////////////////////////////////
  //// View
  */////////////////////////////////////////////
  var view = {
    showPlayer  : function () {
      // get players names
      store.userName = $('#user_name_input').val()
      store.enemyName = $('#enemy_name_input').val()
    },
    showStep    : function () {
      //render step info
      $('#step_number').html('Ход - ' + store.step)
      $('#step_owner').html('Ходит - ' + store.userName)
    },
    startFight  : function () {
      $('#screen_start').toggleClass('hidden')
      $('#screen_combat').toggleClass('hidden')
    },
    renderField : function (owner) {
      var table = $('#' + owner + '_field > tbody')
      table.html('')// clear field on init


      for (var i = 0; i < 10; i++) {// счётчик для Y координаты
        var row = '<tr class="battlefield-row">'
        for (var j = 0; j < 10; j++) {// счётчик для X координаты
          var captionX  = '',
              captionY  = '',
              cellState = ''
          // Добавить подписи для осей
          if (i === 0) captionX = '<div class="marker marker__col">' + store.caption.axisX[j] + '</div>'
          if (j === 0) captionY = '<div class="marker marker__row">' + store.caption.axisY[i] + '</div>'
          // если 0 - пустая ячейка
          // если 1 - есть корабль
          // если 2 - корабль подстрелен
          // если 3 - пустая простреленная
          switch (store.fields.user[i][j]) {
            case 1:
              cellState = 'deck'
              break
            case 2:
              cellState = 'deck hit'
              break
            case 3:
              cellState = 'hit'
              break
          }

          // Отрендерить строку
          row += '<td class="battlefield-cell ' + cellState + '">' +
            '<div class="battlefield-cell-content" data-y="' + i + '" data-x="' + j + '">' +
            captionX +
            captionY +
            '</div>' +
            '</td>'
        }
        row += '</tr>'
        table.append(row)
      }

    },
  }
  /*////////////////////////////////////////////
  //// Model
  */////////////////////////////////////////////
  var model = {
    created        : function () {
      $('#computer_field > tbody').on('click', function (e) {
        model.shot(e)
      })

      model.createField('user')
      model.createField('computer')

      model.createNavy('user')
      model.createNavy('computer')

      view.renderField('user')
      view.renderField('computer')
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

      // если координаты повторяются, снова запускаем функцию
      if (!isValid) return this.createShip(len, owner)
      this.locateShip(ship)
    },
    checkShipCoord : function (ship) {
      var fromX, toX, fromY, toY
      // проверяем начальную позицию

      // задаём начальную и конечную координаты площади занимаемую кораблём
      // если х корабля = 0, значит корабль примыкает к левому краю поля
      // и значит х площади, тоже начинается с нуля
      fromX = (ship.x === 0) ? ship.x : ship.x - 1
      // если корабль расположен вертикально
      if (ship.isVertical) {
        // и примыкает к правой границе
        if (ship.x === 9) toX = ship.x
        else toX = ship.x + 1
      }
      // если корабль расположен горизонтально
      else {
        // и примыкает к правой границе
        if (ship.x + ship.len === 10) toX = 9
        else toX = ship.x + ship.len
      }
      // задаём начальную и конечную Y координату площади
      fromY = (ship.y === 0) ? ship.y : ship.y - 1
      // если корабль расположен вертикально
      if (ship.isVertical) {
        // и примыкает к нижней границе
        if (ship.y + ship.len === 10) toY = 9
        else toY = ship.y + ship.len
      }
      // если корабль расположен горизонтально
      else {
        // и примыкает к нижней границе
        if (ship.y === 9) toY = ship.y
        else toY = ship.y + 1
      }

      // запускаем циклы и проверяем координаты площади
      // если значение равно 1му, значит ячейка занята
      for (var i = fromX; i <= toX; i++) {
        for (var j = fromY; j <= toY; j++) {
          if (store.fields[ship.owner][j][i] === 1) return false
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
