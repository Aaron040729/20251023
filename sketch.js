// =================================================================
// 步驟一：全域變數和成績數據接收
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
let scoreText = "等待 H5P 成績..."; // 初始文字
let fireworks = []; // 【新增】儲存煙火物件的陣列
let gravity; // 【新增】全域重力向量
let isFireworksMode = false; // 【新增】控制是否顯示煙火的旗標

// 接收來自 H5P iframe 的 postMessage 數據
window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; 
        maxScore = data.maxScore;
        
        let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
        
        console.log(`新的分數已接收: ${finalScore}/${maxScore} (${percentage.toFixed(2)}%)`); 
        
        // 【新增】檢查分數是否超過 90%
        if (percentage >= 90) {
            isFireworksMode = true; // 分數優異，開啟煙火模式
        } else {
            isFireworksMode = false; // 分數不夠，關閉煙火模式
            // 清空所有煙火並回到 noLoop 模式
            fireworks = []; 
            if (isLooping()) noLoop();
        }
        
        // 無論分數是否優異，都呼叫 redraw 以更新畫面上顯示的文字
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：p5.js 核心設定
// -----------------------------------------------------------------

function setup() { 
    // 讓 Canvas 佔據畫面大部分空間，或根據需求調整
    // 這裡使用 windowWidth / 2 和 windowHeight / 2 是為了配合您的檔案
    createCanvas(windowWidth / 2, windowHeight / 2); 
    
    // 【關鍵】啟用 HSB 色彩模式 (色相, 飽和度, 亮度)，方便控制顏色
    colorMode(HSB, 360, 100, 100); 
    
    // 設定重力
    gravity = createVector(0, 0.2);

    // 預設關閉 draw() 循環，只在分數改變或需要動畫時運行
    noLoop(); 
} 


// =================================================================
// 步驟三：p5.js 繪圖邏輯 ( draw 函式)
// -----------------------------------------------------------------

function draw() { 
    
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;

    // -----------------------------------------------------------------
    // A. 處理背景與動畫循環
    // -----------------------------------------------------------------
    
    if (isFireworksMode) {
        // 煙火模式：背景半透明，形成拖尾殘影，並保持循環
        background(0, 0, 0, 0.1); // 黑色半透明背景 (HSB: 色相, 飽和度, 亮度, 透明度)
        if (!isLooping()) loop();
        
        // 隨機發射新的煙火 (例如每 20 幀發射一個)
        if (frameCount % 20 === 0 && random(1) < 0.8) {
             // 隨機在畫布頂部 1/3 處發射
            fireworks.push(new Firework(random(width), height));
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
        
    } else {
        // 非煙火模式：清除背景，並關閉循環
        background(0, 0, 100); // 白色不透明背景
        if (isLooping()) noLoop();
    }


    // -----------------------------------------------------------------
    // B. 顯示文字回饋和具體分數
    // -----------------------------------------------------------------
    
    textAlign(CENTER, CENTER); // 文字置中
    noStroke(); 

    // 文字回饋
    textSize(36); 
    
    if (percentage >= 90) {
        // 優異：綠色
        fill(120, 100, 90); 
        text("恭喜！優異成績！🎆", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 良好：黃色
        fill(60, 100, 90); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 需加強：紅色
        fill(0, 100, 90); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 初始狀態
        fill(0, 0, 50);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(24);
    fill(0, 0, 30); // 深灰色
    text(`得分: ${finalScore}/${maxScore} (${percentage.toFixed(1)}%)`, width / 2, height / 2 + 20);
}


// =================================================================
// 步驟四：煙火和粒子類別 (用於實現特效)
// -----------------------------------------------------------------

// ---------------------------
// 粒子類別 (Particle Class)
// ---------------------------
class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.hu = hu; // HSB 色相
        this.firework = firework; // 是否為發射中的火箭 (true) 還是爆炸後的碎屑 (false)
        this.lifespan = 100; // HSB 模式下，亮度 (lifespan) 範圍 0-100
        
        if (this.firework) {
            // 火箭向上發射
            this.vel = createVector(random(-1, 1), random(-12, -8));
            this.maxLife = 100; // 火箭的生命用來判斷爆炸時機
        } else {
            // 爆炸後的碎屑，向隨機方向飛散
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 8)); // 隨機速度
        }
        this.acc = createVector(0, 0);
    }
    
    applyForce(force) {
        this.acc.add(force);
    }
    
    update() {
        if (!this.firework) {
            this.vel.mult(0.95); // 碎屑在空氣中減速
            this.lifespan -= 2.5; // 碎屑逐漸消失
        } else {
            // 火箭本體逐漸向上
            // 當速度開始反轉時 (vel.y >= 0)，它就會爆炸
        }
        
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }
    
    show() {
        if (!this.firework) {
            // 爆炸碎屑
            strokeWeight(3);
            // 顏色 (色相, 飽和度, 亮度, 透明度)
            stroke(this.hu, 100, this.lifespan, this.lifespan / 100); 
            point(this.pos.x, this.pos.y);
        } else {
            // 火箭本體 (拖尾)
            strokeWeight(4);
            // 顏色 (色相, 飽和度, 亮度)
            stroke(this.hu, 100, 100);
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
    // 從指定位置 (x, y) 或隨機位置發射
    constructor(x = random(width), y = height) { 
        this.hu = random(360); // 隨機色相 (0-360)
        this.firework = new Particle(x, y, this.hu, true);
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
        // 產生 50-150 個爆炸粒子
        for (let i = 0; i < random(50, 150); i++) {
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

// 確保窗口大小改變時，Canvas 也能跟著調整 (可選)
function windowResized() {
    // resizeCanvas(windowWidth / 2, windowHeight / 2);
    // 重新繪製一次確保置中正確
    redraw(); 
}
