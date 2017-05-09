# mitbbs-bot-blocker
A Tempermonkey script that manages and hides bot generated content.

使用方法
1. 安装对应当前浏览器的[tampermonkey](https://tampermonkey.net/)插件
2. 到此页面并点击 ‘安装’ https://greasyfork.org/en/scripts/29195-mitbbs-bot-blocker/code
3. 当mitbbs页面载入后，会有个蓝色小方块在页面右下角出现，点击‘黑名单’可以手动加入想屏蔽的ID
4. 框选确认开启屏蔽后会自动从页面屏蔽对应ID的主题（版面页）和回复（贴子内）
5. 在帖子内，每个用户回帖右上角有一个‘屏蔽’按钮，点击确认后会自动将该用户加入黑名单并屏蔽其回帖
