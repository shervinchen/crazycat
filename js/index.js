(function(){
	'use strict';

	/* 定义格子 */
	var Grid = function(x, y, gridRow, gridCol, type, isWalkable) {
		this.gridX = x; // 格子X坐标
		this.gridY = y; // 格子Y坐标
		this.gridRow = gridRow; // 格子所处行数
		this.gridCol = gridCol; // 格子所处列数
		this.gridType = type; // 格子类型 0默认 1障碍 2猫
		this.isWalkable = isWalkable; // 格子是否可行   true可行 false不可行
	};
	
	Grid.prototype = {
		gridColor: ["#B5B5B5", "#FF845E", "#CCFF00"], // 格子颜色
		gridRadius: 24, // 格子半径
		gridGap: 6, //格子间隙
		// 绘制格子
		drawGrid: function(context) {
			context.beginPath();
		    context.arc(this.gridX, this.gridY, this.gridRadius, 0, Math.PI * 2, true);
		    context.fillStyle = this.gridColor[this.gridType];
		    context.fill();
		    context.closePath();
		},

	};

	// /* 定义格子集合 */
	// var Grids = function() {

	// };

	/* 定义障碍 */
	var Barrier = function(x, y) {
		this.barrierX = x; // 障碍X坐标
		this.barrierY = y; // 障碍Y坐标
	};

	Barrier.prototype = {
		
	};

	/* 定义神经猫 */
	var Cat = function(x, y) {
		this.catX = x; // 猫X坐标
		this.catY = y; // 猫Y坐标
	};

	Cat.prototype = {
		
	};

	/* 定义游戏状态 */
	var Game = function(gameStart, gameSteps, gameMinSteps) {
		this.gameStart = gameStart; // 游戏是否开始
		this.gameSteps = gameSteps;
		this.gameMinSteps = gameMinSteps;
	};
	
	Game.prototype = {
		gameGridRowCount: 9, // 游戏格子行数
		gameGridColCount: 9, // 游戏格子列数
		gameBarrierCount: 9, // 游戏障碍个数
		// 设置游戏当前所用步数
		setGameSteps: function(gameSteps) {
			document.getElementById("steps").innerHTML = gameSteps;
		},
		// 设置游戏最短所用步数
		setGameMinSteps: function(gameMinSteps) {
			document.getElementById("minSteps").innerHTML = gameMinSteps;
		}
	};

	/* 程序基本配置 */
	var canvas = document.getElementById("canvas"); // 获得canvas元素
	var context = canvas.getContext("2d"); // 获得context对象

	var game; // 创建游戏对象
	var grids = []; // 创建格子集合
	var isVisited; // 记录节点是否搜索的二维数组
	var barriers = []; // 创建障碍集合
	var cat; // 创建神经猫对象

	var canvasWidth;
	var canvasHeight;

	/* 初始化游戏格子 */
	var initGrids = function() {
		var gridType, grid = new Grid(0, 0, 0, 0, 0, true), isWalkable;

		for (var i = 0; i < game.gameGridRowCount; i++) {
			grids[i] = [];

			for (var j = 0; j < game.gameGridColCount; j++) {
				gridType = 0;
				isWalkable = true;

				for (var k = 0; k < barriers.length; k++) {
					if (barriers[k].barrierX == i && barriers[k].barrierY == j) {
						gridType = 1;
						isWalkable = false;
						break;
					}
				}

				if (cat.catX == i && cat.catY == j) {
					gridType = 2;
					isWalkable = false;
				}
				// 如果为偶数行 从左向右边开始画  否则从右向左
				if (i % 2 == 0) {
					grid = new Grid(grid.gridRadius*6/4+j*(grid.gridRadius*2+grid.gridGap),
									grid.gridRadius+i*(grid.gridRadius*2+grid.gridGap),
									i, j,
									gridType, isWalkable);
				} else {
					grid = new Grid(canvasWidth - (grid.gridRadius*6/4 +(game.gameGridColCount - 1 -j)*(grid.gridRadius*2+grid.gridGap)),
									grid.gridRadius+i*(grid.gridRadius*2+grid.gridGap), 
									i, j,
									gridType, isWalkable);
				}
				grid.drawGrid(context);
				grids[i][j] = grid;
			}
		}
	};

	/* 初始化障碍 */
	var initBarrier = function() {
		var x = [], y = [];

		for (var i = 0; i < game.gameGridRowCount; i++) {
			x.push(i);
		}
		for (var j = 0; j < game.gameGridColCount; j++) {
			y.push(j);
		}

		for (var k = 0; k < game.gameBarrierCount; k++) {
			var randomX = Math.floor(Math.random() * game.gameGridRowCount);
			var randomY = Math.floor(Math.random() * game.gameGridColCount);
			while ((x[randomX] == -1 && y[randomY] == -1) || (randomX == 4 && randomY == 4)) {
				randomX = Math.floor(Math.random() * game.gameGridRowCount);
				randomY = Math.floor(Math.random() * game.gameGridColCount);
			}
			barriers.push(new Barrier(randomX, randomY));
			x[randomX] = -1;
			y[randomY] = -1;
		}
	};

	/* 初始化神经猫 */
	var initCat = function() {
		cat = new Cat(4, 4);
	};

	/* 判断点是否在路径内*/
	var isInPath = function(x, y, grid){
		context.beginPath();
		context.arc(grid.gridX, grid.gridY, grid.gridRadius, 0, Math.PI * 2, true);
		context.closePath();

		return context.isPointInPath(x, y);
	};

	/* 判断当前搜索节点是否为最外层格子  如果到达则表示当前搜索结束 */
	var isSearchEnd = function(grid) {
		if (grid.gridRow == 0 || 
			grid.gridRow == game.gameGridRowCount - 1 ||
			grid.gridCol == 0 || 
			grid.gridCol == game.gameGridColCount - 1) {
			return true;
		}
	};

	/* 寻找当前猫所处位置周围可以移动的格子 */
	var getNextGrids = function(catGrid) {
		// 找到当前格子的所有可走的相邻格子
		var nextGrids = [];

		// 当前猫的行数不同  周围格子的坐标不同
		if (catGrid.gridRow % 2 == 0) {
			if (grids[catGrid.gridRow - 1][catGrid.gridCol - 1].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow - 1][catGrid.gridCol - 1]);
			}
			if (grids[catGrid.gridRow - 1][catGrid.gridCol].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow - 1][catGrid.gridCol]);
			}
			if (grids[catGrid.gridRow][catGrid.gridCol - 1].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow][catGrid.gridCol - 1]);
			}
			if (grids[catGrid.gridRow][catGrid.gridCol + 1].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow][catGrid.gridCol + 1]);
			}
			if (grids[catGrid.gridRow + 1][catGrid.gridCol - 1].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow + 1][catGrid.gridCol - 1]);
			}
			if (grids[catGrid.gridRow + 1][catGrid.gridCol].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow + 1][catGrid.gridCol]);
			}
		} else {
			if (grids[catGrid.gridRow - 1][catGrid.gridCol].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow - 1][catGrid.gridCol]);
			}
			if (grids[catGrid.gridRow - 1][catGrid.gridCol + 1].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow - 1][catGrid.gridCol + 1]);
			}
			if (grids[catGrid.gridRow][catGrid.gridCol - 1].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow][catGrid.gridCol - 1]);
			}
			if (grids[catGrid.gridRow][catGrid.gridCol + 1].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow][catGrid.gridCol + 1]);
			}
			if (grids[catGrid.gridRow + 1][catGrid.gridCol].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow + 1][catGrid.gridCol]);
			}
			if (grids[catGrid.gridRow + 1][catGrid.gridCol + 1].isWalkable) {
				nextGrids.push(grids[catGrid.gridRow + 1][catGrid.gridCol + 1]);
			}
		}

		return nextGrids;
	};
	
	// 搜索路径算法第一种实现：深度优先搜索 Depth-First-Search
	// 前置条件是visit数组全部设置成false
	// 参数grid表示当前开始搜索的节点 depth表示当前到达的深度
	var searchResult = {};

	var depthFirstSearchPath = function(grid, depth) {
		if (isSearchEnd(grid)) { //一旦搜索深度到达一个结束状态，就返回true
			// console.log(depth);
			searchResult.searchEnd = true;
			searchResult.searchDepth = depth;

	        return searchResult;
	    }
		
		// 找到当前节点的所有可走的相邻节点
		var nextGrids = getNextGrids(grid);

	    for (var k = 0; k < nextGrids.length; k++){ // 遍历n相邻的节点nextNode  
	        if (!isVisited[nextGrids[k].gridRow][nextGrids[k].gridCol]){ // 未访问过的节点才能继续搜索   
	            isVisited[nextGrids[k].gridRow][nextGrids[k].gridCol] = true; // 在下一步搜索中，nextNode不能再次出现  

	            if (depthFirstSearchPath(nextGrids[k], depth + 1).searchEnd){ // 如果搜索出有解
	                // 做些其他事情，例如记录结果深度等
	                
	                return searchResult;  // 找到解后 一层一层递归的告诉上层已经找到解
	            }
	  
	            // 重新设置成false，因为它有可能出现在下一次搜索的别的路径中  
	            isVisited[nextGrids[k].gridRow][nextGrids[k].gridCol] = false;  
	        }
	        // 到这里，发现本次搜索还没找到解，那就要从当前节点的下一个节点开始搜索。  
	    }

	    searchResult.searchEnd = false;
	    return searchResult; //本次搜索无解
	};

	/* 对搜索结果的深度进行排序 采用贪心法的策略 选择当前路径最短的格子 */
	var sortSearchDepth = function(sort) {
		var arr = [];

		for (var m = 0; m < sort.length; m++) {
			arr.push(sort[m].objDepth);
		}

		for (var i = 0; i < arr.length - 1; i++) {
	        for (var j = 0; j < arr.length - 1 - i; j++) {
	            if (arr[j] > arr[j + 1]) {
	                var temp = arr[j];
	                arr[j] = arr[j + 1];
	                arr[j + 1] = temp;
	            }
	        }
	    }
	    // console.log(arr);

	    return arr[0];
	};

	/* 移动猫的位置 */
	var moveCat = function() {
		// 根据猫的位置找到猫当前所处的格子
		var catGrid = grids[cat.catX][cat.catY];
		// 初始化记录节点是否搜索的二维数组
		isVisited = [];
		for (var i = 0; i < game.gameGridRowCount; i++) {
			isVisited[i] = [];
			for (var j = 0; j < game.gameGridColCount; j++) {
				isVisited[i][j] = false;
			}
		}
		
		// 找到当前格子的所有可走的相邻格子
		var nextGrids = getNextGrids(catGrid);

		var sort = [];
		var searchObj;

		searchResult.searchEnd = false;
		searchResult.searchDepth = 0;
		
		var result;
		// 搜索每一个相邻格子对应的路径
		for (var k = 0; k < nextGrids.length; k++) {
			result = depthFirstSearchPath(nextGrids[k], 0);
			if (result.searchEnd) {// 如果有路能移动到边缘
				searchObj = {
					objDepth: result.searchDepth,
					obj: nextGrids[k]
				};
				sort.push(searchObj);

				searchResult.searchEnd = false;
				searchResult.searchDepth = 0;
			}
		}

		var sortResult = sortSearchDepth(sort);

		for (var m = 0; m < sort.length; m++) {
			if (sort[m].objDepth == sortResult) {
				// 让猫移动到下一个格子 并更新格子集合数据
				grids[cat.catX][cat.catY].gridType = 0;
				grids[cat.catX][cat.catY].drawGrid(context);
				grids[cat.catX][cat.catY].isWalkable = true;

				cat.catX = sort[m].obj.gridRow;
				cat.catY = sort[m].obj.gridCol;

				grids[cat.catX][cat.catY].gridType = 2;
				grids[cat.catX][cat.catY].drawGrid(context);
				grids[cat.catX][cat.catY].isWalkable = false;
				// 如果猫已经到达边缘 游戏结束 lose
				if (cat.catX == 0 || 
					cat.catX == game.gameGridRowCount - 1 || 
					cat.catY == 0 || 
					cat.catY == game.gameGridColCount - 1) {
					alert("You lose ! Please try again");
				   	document.location.reload();
				}
				break;
			}
		}

		// 猫已经被围住
		if (sort.length == 0) {
			var flag = 0;
			
			var randomMoveGrids = [];
			for (var n = 0; n < nextGrids.length; n++) {
				if (nextGrids[n].isWalkable) {
					randomMoveGrids.push(nextGrids[n]);
					flag = 1;
				}
			}
			
			if (flag == 0) { // 如果猫周围没有可移动的点了 游戏结束 win
				var gameData = window.localStorage.getItem("gameData");
				gameData = JSON.parse(gameData);

				if (gameData != null && gameData != undefined) { // 如果缓存里有值
					if (gameData.gameMinSteps > game.gameSteps) {
						gameData.gameMinSteps = game.gameSteps;
						window.localStorage.setItem("gameData", JSON.stringify(gameData));
					}
				} else {
					var data = {};
					data.gameMinSteps = game.gameSteps;
					window.localStorage.setItem("gameData", JSON.stringify(data));
				}
				

				alert("You win！Steps：" + game.gameSteps);
				document.location.reload();
			} else { // 如果还有可移动的点 就在被围住的范围内随机走
				var index =  Math.floor(Math.random() * randomMoveGrids.length);

				// 让猫移动到下一个格子 并更新格子集合数据
				grids[cat.catX][cat.catY].gridType = 0;
				grids[cat.catX][cat.catY].drawGrid(context);
				grids[cat.catX][cat.catY].isWalkable = true;

				cat.catX = randomMoveGrids[index].gridRow;
				cat.catY = randomMoveGrids[index].gridCol;

				grids[cat.catX][cat.catY].gridType = 2;
				grids[cat.catX][cat.catY].drawGrid(context);
				grids[cat.catX][cat.catY].isWalkable = false;
			}
		}
		
	};

	/* canvas点击事件 */
	canvas.addEventListener("click", function (e) {
		var flag = 0;

		for (var i = 0; i < game.gameGridRowCount; i++) {
			for (var j = 0; j < game.gameGridColCount; j++) {
				if (isInPath(e.offsetX, e.offsetY, grids[i][j])) {
					if (grids[i][j].gridType == 0) {
						grids[i][j].gridType = 1;
						grids[i][j].drawGrid(context);
						grids[i][j].isWalkable = false;
						moveCat();

						game.gameSteps++;
						game.setGameSteps(game.gameSteps);
					}

					flag = 1;
					break;
				}
			}

			if (flag == 1) {
				break;
			}
		}
	}, false);

	// 游戏初始化
	// 简单 中等 困难  默认生成障碍数从多到少
	var initGame = function() {

		game = new Game(true, 0, 0);

		var gameData = window.localStorage.getItem("gameData");
		gameData = JSON.parse(gameData);

		if (gameData != null && gameData != undefined) { // 如果缓存里有值
			game.setGameMinSteps(gameData.gameMinSteps);
		} else {
			game.setGameMinSteps(game.gameMinSteps);
		}

		game.setGameSteps(game.gameSteps);

		var gridDefault = new Grid(0, 0, 0, 0, 0, true);
		canvasWidth = gridDefault.gridRadius*2*game.gameGridRowCount + gridDefault.gridGap*(game.gameGridRowCount-1) + gridDefault.gridRadius*2 + gridDefault.gridGap/2; // 定义画布宽度
		canvasHeight = gridDefault.gridRadius*2*game.gameGridColCount + gridDefault.gridGap*(game.gameGridColCount-1); // 定义画布高度
		
		canvas.setAttribute("width", canvasWidth); // 设置canvas宽度
		canvas.setAttribute("height", canvasHeight); // 设置canvas高度

		initCat();
		initBarrier();
		initGrids();
	};

	initGame();
}());