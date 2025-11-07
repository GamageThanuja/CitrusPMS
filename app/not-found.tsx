"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <div id="wrap">
      <div id="wordsearch">
        <ul>
          <li>k</li>
          <li>v</li>
          <li>n</li>
          <li>z</li>
          <li>i</li>
          <li>x</li>
          <li>m</li>
          <li>e</li>
          <li>t</li>
          <li>a</li>
          <li>x</li>
          <li>l</li>

          <li className="one">4</li>
          <li className="two">0</li>
          <li className="three">4</li>

          <li>y</li>
          <li>y</li>
          <li>w</li>
          <li>v</li>
          <li>b</li>
          <li>o</li>
          <li>q</li>
          <li>d</li>
          <li>y</li>
          <li>p</li>
          <li>a</li>

          <li className="four">p</li>
          <li className="five">a</li>
          <li className="six">g</li>
          <li className="seven">e</li>

          <li>v</li>
          <li>j</li>
          <li>a</li>

          <li className="eight">n</li>
          <li className="nine">o</li>
          <li className="ten">t</li>

          <li>s</li>
          <li>c</li>
          <li>e</li>
          <li>w</li>
          <li>v</li>
          <li>x</li>
          <li>e</li>
          <li>p</li>
          <li>c</li>
          <li>f</li>
          <li>h</li>
          <li>q</li>
          <li>e</li>

          <li className="eleven">f</li>
          <li className="twelve">o</li>
          <li className="thirteen">u</li>
          <li className="fourteen">n</li>
          <li className="fifteen">d</li>

          <li>s</li>
          <li>w</li>
          <li>q</li>
          <li>v</li>
          <li>o</li>
          <li>s</li>
          <li>m</li>
          <li>v</li>
          <li>f</li>
          <li>u</li>
        </ul>
      </div>

      <div id="main-content">
        <h1>We couldn't find what you were looking for.</h1>

        <p>
          Unfortunately the page you were looking for could not be found. It may
          be temporarily unavailable, moved or no longer exist.
        </p>

        <p>
          Check the URL you entered for any mistakes and try again.
          Alternatively, search for whatever is missing or take a look around
          the rest of our site.
        </p>

        <div id="search">
          <form>
            <input type="text" placeholder="Search" />
            {/* Optional submit button could go here */}
          </form>
        </div>

        <div id="navigation">
          <Link className="navigation" href="/">
            Home
          </Link>
          <Link className="navigation" href="/about">
            About Us
          </Link>
          <Link className="navigation" href="/sitemap">
            Site Map
          </Link>
          <Link className="navigation" href="/contact">
            Contact
          </Link>
        </div>
      </div>

      {/* Global styles replicating the original page + pure CSS animation */}
      <style jsx global>{`
        /* If you want Source Sans Pro exactly, add in your root layout:
           <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,300&display=swap" rel="stylesheet" />
        */
        :root {
          --ink: rgba(255, 255, 255, 1);
          --ink-dim: rgba(255, 255, 255, 0.7);
          --tile: rgba(0, 0, 0, 0.2);
          --accent: rgba(26, 188, 156, 0.7);
        }

        html,
        body {
          height: 100%;
        }
        body {
          background-color: #335b67;
          background: radial-gradient(
              ellipse at center,
              #335b67 0%,
              #2c3e50 100%
            )
            fixed no-repeat;
          font-family: "Source Sans Pro", system-ui, -apple-system, Segoe UI,
            Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          margin: 0;
          color: var(--ink);
        }

        ::selection {
          background-color: rgba(0, 0, 0, 0.2);
        }
        ::-moz-selection {
          background-color: rgba(0, 0, 0, 0.2);
        }

        a {
          color: var(--ink);
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.5);
          transition: all 0.5s ease;
          margin-right: 10px;
        }
        a:last-child {
          margin-right: 0;
        }
        a:hover {
          text-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
          border-bottom: 1px solid rgba(255, 255, 255, 1);
        }

        /* === WRAP === */
        #wrap {
          width: 80%;
          max-width: 1400px;
          margin: 8% auto 0;
          height: auto;
          position: relative;
          display: flow-root; /* create a new block formatting context */
        }

        /* === MAIN TEXT CONTENT === */
        #main-content {
          float: right;
          max-width: 45%;
          font-weight: 300;
          font-size: 18px;
          padding-bottom: 40px;
          line-height: 28px;
        }
        #main-content h1 {
          margin: 0 0 40px 0;
          font-weight: 400;
          font-size: 42px;
          line-height: normal;
        }

        /* === NAVIGATION BUTTONS === */
        #navigation {
          margin-top: 2%;
        }
        #navigation a.navigation {
          display: block;
          float: left;
          background-color: rgba(0, 0, 0, 0.2);
          padding: 0 15px;
          color: white;
          height: 41px;
          line-height: 41px;
          font-size: 16px;
          transition: all 0.5s ease;
          margin-right: 2%;
          margin-bottom: 2%;
          border-bottom: none;
        }
        #navigation a.navigation:hover {
          background-color: var(--accent);
          border-bottom: none;
        }

        /* === WORDSEARCH === */
        #wordsearch {
          width: 45%;
          float: left;
        }
        #wordsearch ul {
          margin: 0;
          padding: 0;
        }
        #wordsearch ul li {
          float: left;
          width: 12%;
          background-color: var(--tile);
          list-style: none;
          margin-right: 0.5%;
          margin-bottom: 0.5%;
          padding: 0;
          display: block;
          text-align: center;
          color: var(--ink-dim);
          text-transform: uppercase;
          overflow: hidden;
          font-size: 1.6vw;
          font-weight: 300;
          /* Replace JS sizing with CSS squares */
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
          transition: background-color 0.75s ease, color 0.75s ease;
          border-radius: 4px;
        }

        /* PURE CSS staggered reveal for the specific tiles */
        @keyframes reveal {
          from {
            background-color: var(--tile);
            color: var(--ink-dim);
            transform: scale(1);
          }
          60% {
            transform: scale(1.05);
          }
          to {
            background-color: var(--accent);
            color: var(--ink);
            transform: scale(1);
          }
        }

        /* Sequence timing to match your jQuery delays */
        #wordsearch li.one {
          animation: reveal 0.55s ease forwards;
          animation-delay: 1.5s;
        }
        #wordsearch li.two {
          animation: reveal 0.55s ease forwards;
          animation-delay: 2s;
        }
        #wordsearch li.three {
          animation: reveal 0.55s ease forwards;
          animation-delay: 2.5s;
        }
        #wordsearch li.four {
          animation: reveal 0.55s ease forwards;
          animation-delay: 3s;
        }
        #wordsearch li.five {
          animation: reveal 0.55s ease forwards;
          animation-delay: 3.5s;
        }
        #wordsearch li.six {
          animation: reveal 0.55s ease forwards;
          animation-delay: 4s;
        }
        #wordsearch li.seven {
          animation: reveal 0.55s ease forwards;
          animation-delay: 4.5s;
        }
        #wordsearch li.eight {
          animation: reveal 0.55s ease forwards;
          animation-delay: 5s;
        }
        #wordsearch li.nine {
          animation: reveal 0.55s ease forwards;
          animation-delay: 5.5s;
        }
        #wordsearch li.ten {
          animation: reveal 0.55s ease forwards;
          animation-delay: 6s;
        }
        #wordsearch li.eleven {
          animation: reveal 0.55s ease forwards;
          animation-delay: 6.5s;
        }
        #wordsearch li.twelve {
          animation: reveal 0.55s ease forwards;
          animation-delay: 7s;
        }
        #wordsearch li.thirteen {
          animation: reveal 0.55s ease forwards;
          animation-delay: 7.5s;
        }
        #wordsearch li.fourteen {
          animation: reveal 0.55s ease forwards;
          animation-delay: 8s;
        }
        #wordsearch li.fifteen {
          animation: reveal 0.55s ease forwards;
          animation-delay: 8.5s;
        }

        /* === RESPONSIVE CSS === */
        @media all and (max-width: 899px) {
          #wrap {
            width: 90%;
          }
        }
        @media all and (max-width: 799px) {
          #wrap {
            width: 90%;
            height: auto;
            margin-top: 40px;
            top: 0%;
          }
          #wordsearch {
            width: 90%;
            float: none;
            margin: 0 auto;
          }
          #wordsearch ul li {
            font-size: 4vw;
          }
          #main-content {
            float: none;
            width: 90%;
            max-width: 90%;
            margin: 30px auto 0;
            text-align: justify;
          }
          #main-content h1 {
            text-align: left;
          }
        }
        @media all and (max-width: 499px) {
          #main-content h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
}
