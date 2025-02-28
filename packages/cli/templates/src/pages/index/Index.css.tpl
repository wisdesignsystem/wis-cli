html,
body {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  color: #000;
}

#root {
  width: 100%;
  height: 100%;
}

.home {
  position: absolute;
  width: 100%;
  height: 100%;
  background: url("./background.svg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center 30%;
}

.logo {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -24%);
}

.content {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, 0);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content > h4 {
  margin: 12px 0;
  font-size: 24px;
  font-weight: 600;
}

.content > p {
  color: rgba(0, 0, 0, 0.70);
  font-size: 20px;
  font-weight: 400;
  margin: 0;
}

.container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 24px;
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translate(-50%, 0);
  width: 100%;
  max-width: 896px;
  padding: 24px;
  box-sizing: border-box;
} 

.card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.10);
  text-decoration: none;
  box-sizing: border-box;
  width: calc(100% * 12 / 12 - (12 - 12)*(24px / 12));
}
.card:hover {
  background: #fafafa;
}

.title {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #000;
}

.description {
  color: rgba(0, 0, 0, 0.50);
  font-size: 14px;
  font-weight: 400;
}

@media (min-width: 1024px) {
  .card {
    width: calc(100% * 6 / 12 - (12 - 6)*(24px / 12));
  }
}

@media (min-width: 1280px) {
  .card {
    width: calc(100% * 3 / 12 - (12 - 3)*(24px / 12));
  }
}