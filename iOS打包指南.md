# iOS 客户端打包指南（Windows 环境）

由于原生的 iOS 编译和打包必须依赖 macOS 系统的 Xcode 工具链，在 Windows 环境下，我们为您配置了以下两种**无需物理 Mac 电脑**的高效打包方案：

---

## 🎨 方案 A：HBuilderX 云打包（推荐，可视化操作最简单）

DCloud 提供的 HBuilderX 开发工具支持将静态 Web 网页直接通过云端服务器编译为 iOS `.ipa` 安装包。

### 操作步骤：
1. **下载并安装 HBuilderX**：
   - 访问 [DCloud 官网](https://www.dcloud.io/hbuilderx.html) 下载并安装 Windows 版的 **HBuilderX**。
2. **导入项目**：
   - 打开 HBuilderX，选择菜单 `文件` -> `导入` -> `从本地目录导入`，选择本项目目录 `pic-manage`。
   - HBuilderX 会自动识别根目录下的 `manifest.json`，并将其识别为 HTML5+ 移动应用项目。
3. **配置应用参数**：
   - 双击项目中的 `manifest.json` 即可打开可视化配置界面。
   - 您可以修改“应用名称”（例如 `PicManage`）、“应用标识 (Bundle ID)”、图标等参数。
4. **发起云打包**：
   - 点击顶部菜单 `发行` -> `原生App-云打包`。
   - 在弹出的窗口中勾选 **iOS (ipa)**。
   - **关于证书的选择**：
     - **正式发布**：需要填入您自己的 Apple 开发者证书（`.p12` 文件）以及描述文件（`.mobileprovision`）。
     - **个人测试 / 越狱安装**：如果没有付费开发者账号，在打包窗口中勾选 **“使用越狱证书”**（使用公用的开发证书打包，生成后可通过自签名或签名工具安装）。
5. **等待编译并下载**：
   - 点击底部的 `打包` 按钮，项目代码会上传至 DCloud 云端安全编译。
   - 打包完成后，控制台会输出下载链接，点击即可下载您的 `.ipa` 安装包。

---

## 💻 方案 B：Capacitor + GitHub Actions（极客推荐，全自动免费 CI/CD）

我们已经为您在项目中配置了完整的 **Capacitor 移动端容器** 和 **GitHub Actions 自动化构建脚本**。只要您将代码托管在 GitHub，即可使用 GitHub 的 macOS 云服务器自动编译出 iOS 安装包。

### 1. 自动编译流程：
1. **将项目推送至 GitHub**：
   - 在 GitHub 创建一个私有或公开的仓库。
   - 将本项目代码推送（Push）到该仓库的 `main` 或 `master` 分支。
2. **触发 Actions 构建**：
   - 进入 GitHub 仓库页面，点击顶部的 **`Actions`** 选项卡。
   - 在左侧选择 **`Build iOS IPA`** 工作流。
   - 点击右侧的 **`Run workflow`** 下拉菜单，然后点击绿色的 `Run workflow` 按钮（或者每次您推送代码时，它都会自动运行）。
3. **下载编译产物**：
   - 等待约 2-3 分钟，构建任务完成后，点击进入该次构建记录。
   - 滚动到页面底部，在 **Artifacts（产物）** 列表中点击下载 **`PicManage-unsigned-ipa`**。
   - 解压下载的压缩包，您将获得一个未签名的 **`PicManage-unsigned.ipa`** 文件。

---

## 📲 如何在 iPhone / iPad 上安装打包好的 `.ipa` 文件？

因为未通过 App Store 上架，您可以通过以下几种主流方式将 `.ipa` 安装到您的 iOS 设备上：

### 1. 巨魔商店 TrollStore（最完美，永久免费，免越狱，需特定系统版本）
* **优势**：安装后永不过期，不需要证书签名，支持完全离线安装，没有任何限制。
* **支持系统**：iOS 14.0 至 15.6.1，以及部分 iOS 16.0 至 16.6.1、17.0 设备（具体请参考 [TrollStore 官网安装指南](https://trollstore.app/)）。
* **安装方法**：直接将 `.ipa` 传输到 iPhone，使用 TrollStore 打开并安装即可。

### 2. 个人自签名工具（AltStore / Sideloadly，100% 兼容所有系统）
* **优势**：免费，支持任意 iOS 系统版本（包括 iOS 17 / 18 及更高版本），无需越狱。
* **限制**：由于是免费个人证书签名，每 7 天需要重新签名一次（Sideloadly / AltStore 可以在同一局域网下通过电脑自动无线刷新，非常方便）。
* **安装方法**：
  1. 在 Windows 电脑上下载并安装 [Sideloadly](https://sideloadly.io/) 或 [AltStore](https://altstore.io/)。
  2. 手机用数据线连接电脑，打开工具。
  3. 拖入下载的 `.ipa` 文件，输入您自己的 Apple ID 账号和密码（用于向 Apple 申请个人免费证书）。
  4. 点击 Start，工具会自动编译、签名并直接将 App 写入您的 iPhone。
  5. 安装完成后，在手机的 `设置` -> `通用` -> `VPN 与设备管理` 中信任您自己的 Apple ID 证书即可打开使用。

### 3. 企业签名 / 证书分发服务
* **方法**：如果您拥有企业证书（Enterprise Certificate），可以使用 Esign、轻松签等工具在手机上直接导入证书对 `.ipa` 进行自签名安装。

---

## 🛠️ 本地维护说明（如果您拥有一台 Mac 电脑）

如果您以后在 Mac 电脑上开发，也可以直接在本地运行原生编译：
```bash
# 1. 安装依赖
npm install

# 2. 编译打包 Web 静态资源
npm run build

# 3. 初始化并同步至 iOS 原生工程
npx cap add ios
npx cap sync ios

# 4. 打开 Xcode 进行本地运行/签名/发布
npx cap open ios
```
