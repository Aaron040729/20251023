// =================================================================
// 步驟一：全域變數和成績數據接收 (H5P)
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
let scoreText = "等待 H5P 成績..."; // 初始文字
let fireworks = []; // 儲存煙火物件的陣列
let gravity; // 全域重力向量
let isFireworksMode = false; // 控制是否顯示煙火的旗標

// 接收來自 H5P iframe 的 postMessage 數據
window.addEventListener('message', function (event) {
    
    // 偵錯: 確保收到的數據是物件且包含 type 欄位
    if (typeof event.data !== 'object' || event.data === null || !event.data.type) {
        return; 
    }
    
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // 確保數據有效
        if (typeof data.score !== 'number' || typeof data.maxScore !== 'number') {
             console.error("H5P 數據格式錯誤：score 或 maxScore 不是數字。");
             return;
        }

        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; 
        maxScore = data.maxScore;
        
        let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
        
        // ----------------------------------------
        // 決定是否開啟煙火模式
        // ----------------------------------------
        if (percentage >= 90) {
            isFireworksMode = true; // 分數優異，開啟煙火模式
        } else {
            isFireworksMode = false; // 分數不夠，關閉煙火模式
            fireworks = []; // 清空所有煙火
        }
        
        // 偵錯輸出
        console.log(`分數已接收: ${finalScore}/${maxScore} (${percentage.toFixed(2)}%)，煙火模式: ${isFireworksMode}`);
    }
}, false);


// =================================================================
// 步驟二：p5.js 核心設定
// -----------------------------------------------------------------

function setup() { 
    // 創建 Canvas 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    
    // 啟用 HSB 色彩模式 (色相 0-360, 飽和度 0-100, 亮度 0-100, 透明度 0-1)
    colorMode(HSB, 360, 100, 100, 1); 
    
    gravity = createVector(0, 0.2);

    // 【修正：移除 noLoop()】，讓 draw() 持續運行。
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
        // 煙火模式：暗色背景，半透明產生拖尾效果 (0.1 透明度)
        background(0, 0, 0, 0.1); 
        // 【關鍵修正】高幀率以流暢顯示動畫
        frameRate(60); 
        
        // 隨機發射新的煙火 (每 20 幀，約 0.3 秒，有 80% 機會發射)
        if (frameCount % 20 === 0 && random(1) < 0.8) {
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
        // 非煙火模式：白色背景 (不透明)
        background(0, 0, 100, 1); 
        // 【關鍵修正】低幀率以節省 CPU，但仍保證分數文字會更新
        frameRate(1); 
    }


    // -----------------------------------------------------------------
    // B. 顯示文字回饋和具體分數
    // -----------------------------------------------------------------
    
    textAlign(CENTER, CENTER); 
    noStroke(); 

    // 文字回饋 (大標題)
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
        fill(0, 0, 30);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數 (小字)
    textSize(24);
    fill(0, 0, 30); // 深灰色
    text(`得分: ${finalScore}/${maxScore} (${percentage.toFixed(1)}%)`, width / 2, height / 2 + 20);
}


// =================================================================
// 步驟四：煙火和粒子類別 (無變動)
// -----------------------------------------------------------------

class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.hu = hu; 
        this.firework = firework;
        this.lifespan = 100; 
        
        if (this.firework) {
            this.vel = createVector(random(-1, 1), random(-12, -8));
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 8)); 
        }
        this.acc = createVector(0, 0);
    }
    
    applyForce(force) {
        this.acc.add(force);
    }
    
    update() {
        if (!this.firework) {
            this.vel.mult(0.95); 
            this.lifespan -= 2.5; 
        } 
        
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); 
    }
    
    show() {
        if (!this.firework) {
            strokeWeight(3);
            stroke(this.hu, 100, this.lifespan, this.lifespan / 100); 
            point(this.pos.x, this.pos.y);
        } else {
            strokeWeight(4);
            stroke(this.hu, 100, 100);
            point(this.pos.x, this.pos.y);
        }
    }
    
    done() {
        return !this.firework && this.lifespan < 0;
    }
}

class Firework {
    constructor(x = random(width), y = height) { 
        this.hu = random(360); 
        this.firework = new Particle(x, y, this.hu, true);
        this.exploded = false;
        this.particles = [];
    }
    
    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();
            
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    explode() {
        for (let i = 0; i < random(50, 150); i++) {
            const p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }
    
    show() {
        if (!this.exploded) {
            this.firework.show();
        }
        
        for (let p of this.particles) {
            p.show();
        }
    }
    
    done() {
        return this.exploded && this.particles.length === 0;
    }
}
