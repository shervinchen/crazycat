(function(){
	'use strict';

	/* 定义格子 */
	var Grid = function(gridRow, gridCol, type, isWalkable) {
		this.gridRow = gridRow; // 格子所处行数
		this.gridCol = gridCol; // 格子所处列数
		this.gridType = type; // 格子类型 0默认 1障碍 2猫
		this.isWalkable = isWalkable; // 格子是否可行   true可行 false不可行
	};
	
	Grid.prototype = {
		gridColor: ["#B5B5B5", "#FF845E", "#CCFF00"], // 格子颜色
		gridRadius: 24, // 格子半径 24 20 16 12
		gridGap: 6, //格子间隙 6 5 4 3
		// 绘制格子
		drawGrid: function(game, context) {
			context.beginPath();
		    context.arc(this.getGridPosition(game).gridPositionX, this.getGridPosition(game).gridPositionY, 
		    			this.gridRadius, 0, Math.PI * 2, true);
		    context.fillStyle = this.gridColor[this.gridType];
		    context.fill();
		    context.closePath();
		},
		// 根据格子行列数获取位置坐标
		getGridPosition: function (game) {
			var gridPosition = {};
			// 如果为偶数行 从左向右边开始画  否则从右向左
			if (this.gridRow % 2 == 0) {
				gridPosition.gridPositionX = this.gridRadius * 6 / 4 + this.gridCol * (this.gridRadius * 2 + this.gridGap);
				gridPosition.gridPositionY = this.gridRadius + this.gridRow * (this.gridRadius * 2 + this.gridGap);
			} else {
				gridPosition.gridPositionX = game.gameCanvasWidth - (this.gridRadius * 6 / 4 
												+ (game.gameGridColCount - 1 - this.gridCol) 
												* (this.gridRadius * 2 + this.gridGap));
				gridPosition.gridPositionY = this.gridRadius + this.gridRow * (this.gridRadius * 2 + this.gridGap);
			}
			return gridPosition;
		}
	};

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
		gameBarrierCount: 6, // 游戏障碍个数
		gameCanvasWidth: 0, // 游戏画布宽度
		gameCanvasHeight: 0, // 游戏画布高度
		// 设置游戏当前所用步数
		setGameSteps: function(gameSteps) {
			document.getElementById("steps").innerHTML = gameSteps;
		},
		// 设置游戏最短所用步数
		setGameMinSteps: function(gameMinSteps) {
			document.getElementById("minSteps").innerHTML = gameMinSteps;
		},
		// 设置游戏画布尺寸
		setGameCanvasSize: function() {
			// 获取格子数据
			var gridData = this.getGameGridData();
			// 定义画布宽度
			this.gameCanvasWidth = gridData.gridRadius * 2 * this.gameGridRowCount + 
									gridData.gridGap * (this.gameGridRowCount - 1) 
									+ gridData.gridRadius * 2 + gridData.gridGap / 2;
			// 定义画布高度						
			this.gameCanvasHeight = gridData.gridRadius * 2 * this.gameGridColCount + 
									gridData.gridGap * (this.gameGridColCount - 1);
			// 设置canvas宽度
			document.getElementById("canvas").setAttribute("width", this.gameCanvasWidth);
			// 设置canvas高度
			document.getElementById("canvas").setAttribute("height", this.gameCanvasHeight);
		},
		// 获取游戏格子半径及间隔
		getGameGridData: function() {
			var gridData = {};
			// 根据当前屏幕宽度来动态适配格子半径及间隔
			var clientWidth = document.body.clientWidth;
			if (clientWidth > 1023 && clientWidth < 1440) {
				gridData.gridRadius = 24;
				gridData.gridGap = 6;
			} else if (clientWidth > 768 && clientWidth < 1024) {
				gridData.gridRadius = 20;
				gridData.gridGap = 5;
			} else if (clientWidth > 480 && clientWidth < 769) {
				gridData.gridRadius = 16;
				gridData.gridGap = 4;
			} else if (clientWidth < 481) {
				gridData.gridRadius = 12;
				gridData.gridGap = 3;
			}
			return gridData;
		},
		// 初始化游戏格子
		initGameGrids: function(girdData, gameBarriers, cat) {
			var gridType, grid, isWalkable;
			var gameGrids = [];
			var game = this;
			for (var i = 0; i < this.gameGridRowCount; i++) {
				gameGrids[i] = [];
				for (var j = 0; j < this.gameGridColCount; j++) {
					gridType = 0;
					isWalkable = true;
					for (var k = 0; k < gameBarriers.length; k++) {
						if (gameBarriers[k].barrierX == i && gameBarriers[k].barrierY == j) {
							gridType = 1;
							isWalkable = false;
							break;
						}
					}
					if (cat.catX == i && cat.catY == j) {
						gridType = 2;
						isWalkable = false;
					}
					grid = new Grid(i, j, gridType, isWalkable);
					grid.gridRadius = girdData.gridRadius;
					grid.gridGap = girdData.gridGap;
					grid.drawGrid(game, context);
					gameGrids[i][j] = grid;
				}
			}
			return gameGrids;
		},
		// 初始化障碍
		initGameBarriers: function() {
			var x = [], y = [];
			var gameBarriers = [];
			for (var i = 0; i < this.gameGridRowCount; i++) {
				x.push(i);
			}
			for (var j = 0; j < this.gameGridColCount; j++) {
				y.push(j);
			}
			for (var k = 0; k < this.gameBarrierCount; k++) {
				var randomX = Math.floor(Math.random() * this.gameGridRowCount);
				var randomY = Math.floor(Math.random() * this.gameGridColCount);
				while ((x[randomX] == -1 && y[randomY] == -1) || (randomX == 4 && randomY == 4)) {
					randomX = Math.floor(Math.random() * this.gameGridRowCount);
					randomY = Math.floor(Math.random() * this.gameGridColCount);
				}
				gameBarriers.push(new Barrier(randomX, randomY));
				x[randomX] = -1;
				y[randomY] = -1;
			}
			return gameBarriers;
		},
		// 初始化神经猫
		initGameCat: function() {
			var catPosX = (game.gameGridRowCount - 1) / 2;
			var catPosY = (game.gameGridColCount - 1) / 2;
			return (new Cat(catPosX, catPosY));
		}
	};

	/* 程序基本配置 */
	var canvas = document.getElementById("canvas"); // 获得canvas元素
	var context = canvas.getContext("2d"); // 获得context对象

	var game; // 创建游戏对象
	var gameGrids = []; // 创建格子集合
	var cat; // 创建神经猫对象
	var isVisited; // 记录节点是否搜索的二维数组
	var searchDepth; // 记录节点搜索深度

	/* 判断点是否在路径内*/
	var isInPath = function(x, y, grid){
		var gridPosition = grid.getGridPosition(game);
		context.beginPath();
		context.arc(gridPosition.gridPositionX, gridPosition.gridPositionY, 
					grid.gridRadius, 0, Math.PI * 2, true);
		context.closePath();
		return context.isPointInPath(x, y);
	};

	/* 判断当前搜索节点是否为最外层格子  如果到达则表示当前搜索结束 */
	var isSearchEnd = function(grid) {
		if (grid.gridRow == 0 || grid.gridRow == game.gameGridRowCount - 1 ||
			grid.gridCol == 0 || grid.gridCol == game.gameGridColCount - 1) {
			return true;
		}
	};

	/* 寻找当前猫所处位置周围可以移动的格子 */
	var getNextGrids = function(depth, catGrid) {
		// 找到当前格子的所有可走的相邻格子
		var nextGrids = [];
		// 偶数行周围格子的坐标
		var evenRowNextGridPos = [
			[-1, -1], [-1, 0],
			[0,  -1], [0,  1],
			[1,  -1], [1,  0]
		]; 
		// 奇数行周围格子的坐标
		var oddRowNextGridPos = [
			[-1, 0], [-1, 1],
			[0, -1], [0,  1],
			[1,  0], [1,  1]
		];
		var nextGridPos = [];
		// 当前猫的行数不同  周围格子的坐标不同
		if (catGrid.gridRow % 2 == 0) {
			nextGridPos = evenRowNextGridPos;
		} else {
			nextGridPos = oddRowNextGridPos;
		}
		for (var i = 0; i < nextGridPos.length; i++) {
			var row = nextGridPos[i][0];
			var col = nextGridPos[i][1];
			if (gameGrids[catGrid.gridRow + row][catGrid.gridCol + col].isWalkable) {
				if (!isVisited[catGrid.gridRow + row][catGrid.gridCol + col]) {
					gameGrids[catGrid.gridRow + row][catGrid.gridCol + col].searchDepth = depth + 1;
				}
				nextGrids.push(gameGrids[catGrid.gridRow + row][catGrid.gridCol + col]);
			}
		}
		return nextGrids;
	};
	
	// 搜索路径算法第一种实现：深度优先搜索 Depth-First-Search
	// 前置条件是visit数组全部设置成false
	// 参数grid表示当前开始搜索的节点 depth表示当前到达的深度
	var depthFirstSearchPath = function(grid, depth) {
		// 一旦搜索节点到达边界，就返回true，并记录搜索深度
		if (isSearchEnd(grid)) {
			searchDepth = depth;
	        return true;
	    }
		// 找到当前节点的所有相邻节点
		var nextGrids = getNextGrids(grid);
		// 遍历相邻节点
	    for (var k = 0; k < nextGrids.length; k++){
	    	// 未访问过的节点才能继续搜索
	        if (!isVisited[nextGrids[k].gridRow][nextGrids[k].gridCol]){
	        	// 在下一步搜索中，nextNode不能再次出现
	            isVisited[nextGrids[k].gridRow][nextGrids[k].gridCol] = true;  
	            // 如果搜索出有解 一层一层通过递归的告诉上层已经找到解
	            if (depthFirstSearchPath(nextGrids[k], depth + 1)){
	                return true;
	            }
	            // 重新设置成false，因为它有可能出现在下一次搜索的别的路径中  
	            isVisited[nextGrids[k].gridRow][nextGrids[k].gridCol] = false;  
	        }
	        // 到这里，发现本次搜索还没找到解，那就要从当前节点的下一个节点开始搜索。  
	    }
	    // 本次搜索无解
	    return false;
	};

	// 搜索路径算法第二种实现：广度优先搜索 Breadth-First-Search
	var breadthFirstSearchPath = function(grid) {
		if (isSearchEnd(grid)) {
			// 记录路径，这条路径即为最短路径
			searchDepth = grid.searchDepth;
	        return true;
	    }
		// 待搜索的节点队列
		var gridQueue = [];
		// 将起点放进队列
		gridQueue.push(grid);
		// 设置起点的访问状态为已访问
		isVisited[grid.gridRow][grid.gridCol] = true;
		// 队列不为空就继续搜索
		while (gridQueue.length != 0) {
			// 取出队列的头并删除队列的头
			var gridQueueFront = gridQueue.shift();
			// 找到当前节点的所有相邻节点
			var nextGrids = getNextGrids(gridQueueFront.searchDepth, gridQueueFront);
			// 遍历相邻节点
		    for (var k = 0; k < nextGrids.length; k++) {
		    	if (isSearchEnd(nextGrids[k])) {
					// 记录路径，这条路径即为最短路径
					searchDepth = nextGrids[k].searchDepth;
			        return true;
			    }
		    	// 未访问过的节点才能继续搜索
		        if (!isVisited[nextGrids[k].gridRow][nextGrids[k].gridCol]) {
		            // 将节点加入队列
		            gridQueue.push(nextGrids[k]);
					// 在下一步搜索中，nextNode不能再次出现
		            isVisited[nextGrids[k].gridRow][nextGrids[k].gridCol] = true;
		        }
		    }
		}
		// 无解
		return false;
	};

	/* 计算每个最短路径格子对应方向存在的障碍数量，选择障碍数最少的方向 */
	var sortLeftUpBarriersCount = function(catGrid) {
		// 左上
		var barriesCount = 0;
		for (var i = 0; i < catGrid.gridCol; i++) {
			for (var j = 0; j < catGrid.gridRow; j++) {
				if (gameGrids[i][j].gridType == 1) {
					barriesCount++;
				}
			}
		}
		return barriesCount;
	};

	/* 对搜索结果的路径深度进行排序 选择最短的路径深度 */
	var sortSearchDepth = function(gridsSearchResult) {
		var arr = [];
		for (var m = 0; m < gridsSearchResult.length; m++) {
			arr.push(gridsSearchResult[m].gridDepth);
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
	    return arr[0];
	};

	/* 重置记录节点访问状态的数组 */
	var resetGridVisited = function() {
		isVisited = [];
		for (var i = 0; i < game.gameGridRowCount; i++) {
			isVisited[i] = [];
			for (var j = 0; j < game.gameGridColCount; j++) {
				isVisited[i][j] = false;
			}
		}
	};

	/* 重置节点搜索深度 */
	var resetGridDepth = function() {
		for (var i = 0; i < game.gameGridRowCount; i++) {
			for (var j = 0; j < game.gameGridColCount; j++) {
				if (gameGrids[i][j].isWalkable) {
					gameGrids[i][j].searchDepth = 1;
				}
			}
		}
	};

	/* 更新格子状态 */
	var updateGameGrid = function(x, y, type, isWalkable) {
		gameGrids[x][y].gridType = type;
		gameGrids[x][y].drawGrid(game, context);
		gameGrids[x][y].isWalkable = isWalkable;
	};

	/* 判断游戏是否失败 */
	var isGameLose = function() {
		if (cat.catX == 0 || cat.catX == game.gameGridRowCount - 1 || 
			cat.catY == 0 || cat.catY == game.gameGridColCount - 1) {
			alert("You lose ! Please try again");
			document.location.reload();
		}
	};

	/* 搜索当前节点的相邻节点，并找到其对应的路径 */
	var getSearchResults = function(nextGrids) {
		var results = [];
		for (var k = 0; k < nextGrids.length; k++) {
			// // dfs只能找到一个节点的一个解，并且不一定是最优解
			// if (depthFirstSearchPath(nextGrids[k], 0)) {
			// 	results.push({
			// 		gridDepth: searchDepth,
			// 		grid: nextGrids[k]
			// 	});
			// }

			// bfs 能找到每一步的最短路径
			if (breadthFirstSearchPath(nextGrids[k])) {
				results.push({
					gridDepth: searchDepth,
					grid: nextGrids[k]
				});
				resetGridVisited();
				resetGridDepth();
			}
		}
		return results;
	};

	/* 判断游戏是否胜利 */
	var isGameWin = function(gridsSearchResult) {
		if (gridsSearchResult.length == 0) {
			var gameData = JSON.parse(window.localStorage.getItem("gameData"));
			// 如果缓存里有值
			if (gameData != null && gameData != undefined) {
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
		}
	};

	/* 清除格子显示痕迹 */
	var clearGridView = function(girdRow, gridCol, gridType, isWalkable) {
		// 获得猫所处的格子
		var grid = new Grid(girdRow, gridCol, gridType, isWalkable);
		grid.gridRadius = game.getGameGridData().gridRadius;
		grid.gridGap = game.getGameGridData().gridGap;
		// 清除痕迹
		context.clearRect(grid.getGridPosition(game).gridPositionX - grid.gridRadius, 
		grid.getGridPosition(game).gridPositionY - grid.gridRadius,
		grid.gridRadius * 2, grid.gridRadius * 2);
	};

	/* 移动猫的位置 */
	var moveCat = function() {
		// 找到当前节点周围所有可走的相邻节点
		var nextGrids = getNextGrids(searchDepth, gameGrids[cat.catX][cat.catY]);
		// 获得相邻节点的搜索结果
		var gridsSearchResult = getSearchResults(nextGrids);
		console.log(gridsSearchResult);
		// 让猫移动到周围路径最短的那个格子
		var moveGrids = [];
		for (var m = 0; m < gridsSearchResult.length; m++) {
			if (gridsSearchResult[m].gridDepth == sortSearchDepth(gridsSearchResult)) {
				moveGrids.push(gridsSearchResult[m].grid);
			}
		}
		var randomMoveGrid = moveGrids[Math.floor(Math.random() * moveGrids.length)];
		// 清除猫的痕迹
		clearGridView(cat.catX, cat.catY, 2, false);
		// 格子重置为默认状态
		updateGameGrid(cat.catX, cat.catY, 0, true);
		// 让猫移动到下一个格子
		if (gridsSearchResult.length != 0) {
			cat.catX = randomMoveGrid.gridRow;
			cat.catY = randomMoveGrid.gridCol;
		}
		// 让格子状态变为猫
		updateGameGrid(cat.catX, cat.catY, 2, false);
		// 判断是否lose
		isGameLose();
		// break;
		// 判断是否win
		isGameWin(gridsSearchResult);
	};

	/* canvas点击事件 */
	canvas.addEventListener("click", function (e) {
		for (var i = 0; i < game.gameGridRowCount; i++) {
			for (var j = 0; j < game.gameGridColCount; j++) {
				if (isInPath(e.offsetX, e.offsetY, gameGrids[i][j])) {
					if (gameGrids[i][j].gridType == 0) {
						// 清除默认格子痕迹
						clearGridView(i, j, 1, true);
						// 让格子变为障碍
						updateGameGrid(i, j, 1, false);
						// 重置节点搜索的访问状态
						resetGridVisited();
						resetGridDepth();
						// 重置当前节点的搜索深度
						searchDepth = 0;
						// 移动猫
						moveCat();
						// 增加游戏所用步数
						game.gameSteps++;
						game.setGameSteps(game.gameSteps);
					}
					return;
				}
			}
		}
	}, false);

	// 游戏初始化
	// 简单 中等 困难  默认生成障碍数从多到少
	var initGame = function() {
		// 游戏对象初始化
		game = new Game(true, 0, 0);
		// 获取缓存中的游戏记录数据
		var gameData = JSON.parse(window.localStorage.getItem("gameData"));
		// 判断缓存里是否有值
		if (gameData != null && gameData != undefined) {
			game.setGameMinSteps(gameData.gameMinSteps);
		} else {
			game.setGameMinSteps(game.gameMinSteps);
		}
		// 初始化当前游戏步数
		game.setGameSteps(game.gameSteps);
		// 设置当前游戏画布大小
		game.setGameCanvasSize();
		// 初始化神经猫
		cat = game.initGameCat();
		// 初始化格子
		gameGrids = game.initGameGrids(game.getGameGridData(), game.initGameBarriers(), cat);
	};

	initGame();
}());