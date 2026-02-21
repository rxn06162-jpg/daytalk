# ☀️ DayTalk

1日一言、気分を記録するシンプルな日記PWAアプリ。

🔗 **[アプリを開く](https://rxn06162-jpg.github.io/daytalk/)**

---

## 機能

- 気分アイコンを10種類から選択
- 140文字までの一言コメントを記録
- 過去の記録を一覧表示・削除
- オフラインでも動作（Service Worker対応）
- ホーム画面に追加してアプリとして使用可能

## 使い方

### Androidでホーム画面に追加

1. ChromeでアプリURLを開く
2. 右上の「︙」→「ホーム画面に追加」
3. アイコンが作成されアプリとして使える

## 技術スタック

- HTML / CSS / JavaScript（バニラ）
- LocalStorage（データ保存）
- PWA（manifest.json + Service Worker）
- ホスティング：GitHub Pages（無料）

## ローカルで動かす

```bash
git clone https://github.com/rxn06162-jpg/daytalk.git
cd daytalk
# 任意のローカルサーバーで開く（例：VS Code Live Server）
```
