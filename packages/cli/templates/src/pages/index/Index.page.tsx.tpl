import { ArrowRightIcon } from "@wisdesign/lsicon";

import logo from "./logo.svg"

import "./Index.css"

function Home() {
  return (
    <div className="home">
      <img className="logo" src={logo} alt="wis" />
      <div className="content">
        <h4>Hello Wis</h4>
        <p>It's my first wis app.</p>
      </div>
      <div className="container">
        <a href="https://wis.design/get-started" className="card">
          <div className="title">
            Wis UI
            <ArrowRightIcon />
          </div>
          <div className="description">The react framework for PC & Mobile.</div>
        </a>
        <a href="https://wis.design/layout" className="card">
          <div className="title">
            Layout
            <ArrowRightIcon />
          </div>
          <div className="description">Flexible runtime layouts, customizable for various scenarios.</div>
        </a>
        <a href="https://wis.design/router" className="card">
          <div className="title">
            Router
            <ArrowRightIcon />
          </div>
          <div className="description">Uses file-system based routing.</div>
        </a>
        <a href="https://wis.design/remote" className="card">
          <div className="title">
            Resource
            <ArrowRightIcon />
          </div>
          <div className="description">Provides easy inter-project resource sharing.</div>
        </a>
      </div>
    </div>
  )
}

export default Home