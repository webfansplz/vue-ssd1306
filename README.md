# vue-ssd1306

![vue-ssd1306](https://s3.ax1x.com/2020/12/05/DL04dH.jpg)

## Introduction

A Vue Renderer for SSD1306 OLED chip on Raspberry Pi

This project demonstrates how to:

- Use Vue together with NodeJs on Raspberry Pi.
- Build a custom renderer for Vue.
- How does Node.js drive SSD1306 OLED on Raspberry Pi.

[Article Details](./Article.md)

## Getting Started

This project only works on Raspberry Pi.

Connect the ssd1306 oled chip, make sure you have Node.js installed on your Raspberry Pi, with I2C interface enabled. Few extra packages are also required:

```shell
sudo apt-get install i2c-tools
```

## Usage

```shell
npm install
npm run build
npm run serve
```

## License

[MIT](./LICENSE)
