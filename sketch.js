// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字
let fireworks = []; // 【新增】儲存煙火物件的陣列
let gravity; // 【新增】全域重力向量
let showFireworks = false; // 【新增】控制是否顯示煙火的旗標

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // 【新增】檢查分數是否超過 90%
        let percentage = (finalScore / maxScore) * 100;
        if (percentage >= 90) {
            showFireworks = true; // 分數優異，開啟煙火
            // 首次收到高分時發射一個煙火
            fireworks.push(new Firework()); 
        } else {
            showFireworks = false; // 分數不夠，關閉煙火
            fireworks = []; // 清除所有煙火
        }
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    colorMode(HSB); // 【新增】使用 HSB 色彩模式方便顏色變化
    background(255); 
    noLoop(); 
    
    // 【新增】設定重力
    gravity = createVector(0, 0.2);
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // 讓背景有一點點殘影，用於模擬煙火拖尾效果
    background(255, 20); // 淺色背景，略微透明
    
    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(100, 255, 100); // 綠色 (HSB)
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色
        fill(45, 255, 100); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色
        fill(0, 255, 100); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美
        fill(100, 200, 150, 0.6 * 255); // 綠色 (HSB)
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
        // 【關鍵：煙火特效】
        // 當分數達到 90% 時，開始循環發射煙火
        if (showFireworks) {
            // 啟用 loop 讓 draw() 保持不斷執行，直到煙火結束或分數改變
            loop(); 
            
            // 隨機發射新的煙火 (例如每 20 幀發射一個)
            if (frameCount % 20 === 0 && random(1) < 0.6) {
                fireworks.push(new Firework());
            }

            // 更新並顯示所有煙火
            for (let i = fireworks.length - 1; i >= 0; i--) {
                fireworks[i].update();
                fireworks[i].show();
                // 移除已經結束的煙火
                if (fireworks[i].done()) {
                    fireworks.splice(i, 1);
                }
            }
            
            // 如果煙火都結束了且分數仍然是 90% 以上，就再發射一個
            if (fireworks.length === 0) {
                // 如果沒有煙火了，但旗標還開著，就等下一幀發射
            }
        }
        
    } else if (percentage >= 60) {
        // 分數下降到 90% 以下時，停止 loop
        if (isLooping()) noLoop();
        
        // 畫一個方形
        fill(45, 255, 150, 0.6 * 255); // 黃色 (HSB)
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
        
    } else {
         // 分數不夠，停止 loop
        if (isLooping()) noLoop();
    }
}

// =================================================================
// 步驟三：煙火和粒子類別 (用於實現特效)
// -----------------------------------------------------------------

// ---------------------------
// 粒子類別 (Particle Class)
// ---------------------------
class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.hu = hu; // HSB 色相
        this.firework = firework; // 是否為發射中的火箭 (true) 還是爆炸後的碎屑 (false)
        this.lifespan = 255;
        
        if (this.firework) {
            // 火箭向上發射
            this.vel = createVector(random(-1, 1), random(-15, -8));
        } else {
            // 爆炸後的碎屑，向隨機方向飛散
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 隨機速度
        }
        this.acc = createVector(0, 0);
    }
    
    applyForce(force) {
        this.acc.add(force);
    }
    
    update() {
        if (!this.firework) {
            this.vel.mult(0.95); // 碎屑在空氣中減速
            this.lifespan -= 4; // 碎屑快速消失
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }
    
    show() {
        colorMode(HSB);
        
        if (!this.firework) {
            // 爆炸碎屑
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan);
            point(this.pos.x, this.pos.y);
        } else {
            // 火箭本體 (拖尾)
            strokeWeight(4);
            stroke(this.hu, 255, 255);
            point(this.pos.x, this.pos.y);
        }
    }
    
    done() {
        // 只有爆炸碎屑才會結束生命
        return !this.firework && this.lifespan < 0;
    }
}


// ---------------------------
// 煙火類別 (Firework Class)
// ---------------------------
class Firework {
    constructor() {
        this.hu = random(255); // 隨機色相
        // 從畫布底部隨機位置開始發射
        this.firework = new Particle(random(width), height, this.hu, true);
        this.exploded = false;
        this.particles = [];
    }
    
    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();
            
            // 當火箭速度開始下降 (y 軸速度 >= 0) 就爆炸
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }
        
        // 更新爆炸後的粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    explode() {
        // 產生 100 個以上的爆炸粒子
        for (let i = 0; i < 150; i++) {
            const p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }
    
    show() {
        if (!this.exploded) {
            this.firework.show();
        }
        
        // 顯示爆炸後的粒子
        for (let p of this.particles) {
            p.show();
        }
    }
    
    done() {
        // 火箭已爆炸，且所有粒子都已消失
        return this.exploded && this.particles.length === 0;
    }
}
