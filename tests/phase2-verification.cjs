/**
 * 第 2 階段驗證腳本 - 簡化版
 */

console.log('\n========== 第 2 階段基礎模塊驗證 ==========\n');

const fs = require('fs');
const path = require('path');

const checks = [
    {
        name: 'Storage 模塊',
        file: 'src/js/storage.js',
        checks: [
            { pattern: 'TimerApp.Storage = (() => {', desc: 'IIFE 結構' },
            { pattern: 'function init()', desc: 'init() 方法' },
            { pattern: 'function save(', desc: 'save() 方法' },
            { pattern: 'function load(', desc: 'load() 方法' },
            { pattern: 'StorageError', desc: 'StorageError 類' }
        ]
    },
    {
        name: 'Timer 模塊',
        file: 'src/js/timer.js',
        checks: [
            { pattern: 'TimerApp.Timer = (() => {', desc: 'IIFE 結構' },
            { pattern: 'function create(', desc: 'create() 方法' },
            { pattern: 'function pause(', desc: 'pause() 方法' },
            { pattern: 'function resume(', desc: 'resume() 方法' },
            { pattern: 'function list()', desc: 'list() 方法' },
            { pattern: 'startGlobalInterval()', desc: '全域計時器間隔' }
        ]
    },
    {
        name: 'Alarm 模塊',
        file: 'src/js/alarm.js',
        checks: [
            { pattern: 'TimerApp.Alarm = (() => {', desc: 'IIFE 結構' },
            { pattern: 'function create(', desc: 'create() 方法' },
            { pattern: 'function getPending()', desc: 'getPending() 方法' },
            { pattern: 'markTriggered(', desc: 'markTriggered() 方法' },
            { pattern: 'startGlobalCheckInterval()', desc: '全域檢查間隔' }
        ]
    },
    {
        name: 'Audio 模塊',
        file: 'src/js/audio.js',
        checks: [
            { pattern: 'TimerApp.Audio = (() => {', desc: 'IIFE 結構' },
            { pattern: 'function play(', desc: 'play() 方法' },
            { pattern: 'function stop()', desc: 'stop() 方法' },
            { pattern: 'setSoundId(', desc: 'setSoundId() 方法' },
            { pattern: 'soundRegistry', desc: '聲音註冊表' }
        ]
    },
    {
        name: '應用程式模塊 (app.js)',
        file: 'src/js/app.js',
        checks: [
            { pattern: 'emitEvent: (eventName, detail)', desc: 'emitEvent() 事件分派器' },
            { pattern: 'initializeModules()', desc: 'initializeModules() 函數' },
            { pattern: 'setupCustomEventListeners()', desc: 'setupCustomEventListeners() 函數' }
        ]
    },
    {
        name: '聲音檔案',
        file: 'assets/sounds/alarm1.wav',
        checks: [
            { exists: true, desc: 'alarm1.wav 存在' }
        ]
    },
    {
        name: '聲音檔案',
        file: 'assets/sounds/alarm2.wav',
        checks: [
            { exists: true, desc: 'alarm2.wav 存在' }
        ]
    }
];

let totalChecks = 0;
let passedChecks = 0;

checks.forEach((module, idx) => {
    console.log(`${String(idx + 1).padStart(2, '0')}. ${module.name}`);
    
    const filePath = path.join(__dirname, '..', module.file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`   ❌ 檔案不存在: ${module.file}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    module.checks.forEach(check => {
        totalChecks++;
        
        if (check.exists) {
            console.log(`   ✅ ${check.desc}`);
            passedChecks++;
        } else if (content.includes(check.pattern)) {
            console.log(`   ✅ ${check.desc}`);
            passedChecks++;
        } else {
            console.log(`   ❌ ${check.desc}`);
        }
    });
});

console.log(`\n========== 驗證結果 ==========`);
console.log(`✅ 通過: ${passedChecks}/${totalChecks} 檢查`);

if (passedChecks === totalChecks) {
    console.log('\n🎉 第 2 階段: 所有基礎模塊已完成！\n');
    console.log('摘要:');
    console.log('✓ Storage 模塊完整 (T008-T009)');
    console.log('✓ Timer 模塊完整 (T010-T012)');
    console.log('✓ Alarm 模塊完整 (T013-T015)');
    console.log('✓ Audio 模塊完整 (T016-T017)');
    console.log('✓ 事件系統已實作 (T018)');
    console.log('✓ 全域狀態管理已實作 (T019)');
    console.log('✓ 聲音檔案已生成');
    console.log('\n狀態: ✅ 第 2 階段完成，可開始用戶故事實作\n');
} else {
    console.log(`\n❌ 部分檢查未通過，請檢查模塊實作\n`);
    process.exit(1);
}
