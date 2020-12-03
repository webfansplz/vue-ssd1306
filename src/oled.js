// JavaScript Robotics and IoT programming framework, developed at Bocoup.
const five = require("johnny-five");
// Raspi IO is an I/O plugin for the Johnny-Five Node.js robotics platform that enables Johnny-Five to control the hardware on a Raspberry Pi.
const Raspi = require("raspi-io").RaspiIO;
const font = require("oled-font-5x7");
// 📺 johnny-five compatible lib for OLED screens
const Oled = require("oled-js");
const OPTS = {
  width: 128, // 分辨率  0.96寸 ssd1306 128*64
  height: 64, // 分辨率
  address: 0x3c, // 控制输入地址,ssd1306 默认为0x3c
};
class OledService {
  constructor() {
    this.oled = null;
  }
  /**
   * 初始化: 创建一个Oled实例
   * 创建后,我们就可以通过操作Oled实例来控制屏幕了
   */
  init() {
    const board = new five.Board({
      io: new Raspi(),
    });
    // 程序退出,关闭屏幕
    board.on("exit", () => {
      this.oled && this.remove();
    });
    return new Promise((resolve, reject) => {
      board.on("ready", () => {
        // Raspberry Pi connect SSD 1306
        this.oled = new Oled(board, five, OPTS);
        // 打开屏幕显示
        this.oled.turnOnDisplay();
        resolve();
      });
    });
  }
  drawText({ text, x, y }) {
    // 重置光标位置
    this.oled.setCursor(+x, +y);
    // 绘制文字
    this.oled.writeString(font, 2, text, 1, true, 2);
  }
  clear({ x, y }) {
    this.oled.setCursor(+x, +y);
  }
  update() {
    this.oled.update();
  }
  remove() {
    // 关闭显示
    this.oled.turnOffDisplay();
    this.oled = null;
  }
}
export function oledService() {
  return new OledService();
}
