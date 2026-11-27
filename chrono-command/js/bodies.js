/* Chrono Command — base bodies.
   Every leader and every foot soldier is built from one animated base figure (a sheet of frames facing right:
   idle, cheer, thrust, walk, throw and swing). Each frame is split into body parts (head, neck, torso, arms, hands,
   legs, feet) and recoloured along its own shading ramp to dress it, so the original pixel shading survives.
   Hair, hats, beards, capes, shields and weapons are then drawn on top, placed from the head and hands found in
   that frame, so they move with the animation. */
(function (G) {
  'use strict';
  const CW = G.CW;
  const FW = 48; // frame size in the base sheet
  const FH = 52;
  const SHEET = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnAAAAE4CAYAAADb8M4/AABQxklEQVR42u29X2hjSZrm/Sor2WRZZhjYVMoJxptf10WiAblXaAa2oDCmLUOy4sNXLhbsC5cu3A2FGFq7vhkWV2Pmzt3aC1EwlQku09jQlFhYX7gp1nIhREPBssaN1bTIHSgSIUipPLsXPRe7y3eh70J6j98TOpKOdKQTEdLzA1OV1h8/ESdOxHPeiHiDCAAAAAAAAAAAAAAAAAAAAAAAQI/ItL7o5fMXnVHvefv+XcTUioB+6Id+6AcAAFt4PK2OMx9fplQ6TksrMYom15zX72+r1Gq06aZcpwJRx7SOFPqhH/qhHwAAbCNQR/by+YsOd5yJre2h73V1pPWmEZ0o9EM/9EM/AAAslIHjzjOTXXc98Y7qRImILk8q2jtR6Id+6Id+DAEAAFt5FOTDsvOMxBLOzyD4vZnsuhGFh37oh37oBwCAhTFw/PTr98nXqxPNx5d9LTye5dM79EM/9EM/AAAsjIEjIkql44H+cNDPBwX6oR/6oR8AAGxl4l2oSysx17877Vqgz4cN9EM/9EM/AADYysQRuEmmL6bx2WkB/dAP/dAPAAALZ+AAAAAAAAAMHAAAAAAAmKWB45xKtYuS8zMOuqcxoB/6F0H/y+cvOl67LVH/mEYFACyogWs12k4nylnQ+d9eHa3Xazrxq99UoB/6/Ri3u/JrOs9t9qXMWJT711T9AACgxcC9ff8uslO8cv1O7UTvb6tUuyjR5UmFTnNH1Gq0PTtWHfjRP2oAsEX/qAgG9M9f++E8aee5TZe2Wdy/bBQHRfp01b/J/Q8AAGgzcPIpWKJOSxy/+py+/eVvqFBvktrhXp5UjHiKH6R/1ABguv5RQP98tx/Oc8ZTi3fl155RuGncv+e5TcrHlx1DZ0r7Mb3/AQAALQaOn4JvynVnkJBPtdHkGr2JP6U38adERPTjXMH1ed1nEQ7Tz/8dNgDYoH/Q76B//tvPTbne9zt5+sA07l82b/L7Tah/G/ofAADQZuC4Ey3Um3RTrtNp7qhv0H3yffe/H3wYpz/89o1xhR+knweAXz/5I72JP6UPPozTBx/GrdI/KgIE/fPfftjEDVrgH/T+zceX6aZc9zSLOuvflv4HAACC8DjoF7x9/y5SIOrIp285lfHk+yrdfvnzvsHZqEF4TvVHk0SJrf7PQP/8t59CvdkXEdsrHhLljqhA1OHoE+5fAACwk6nlgSvUm3R5UnHtDvOidlGijYMz46YvoB/6mUkW5pukX363Gh3jtXFqucbV7zVdytOqaP8AADB7ptKJ8a43daBYWok5T8P3t1VqNdq0U7wyrvOEfuhX9dyVXzv/Xk3vD/ybbIQm1a8aqWmWjes1lY67dmmyDsk4+r3ezyZKR9uyvf0DAMAkBJ5Cffn8Ref6eJeiyTWnk3x48q8TUcXzM6Z0otAP/YMiNYmtbYrEEpSPL7umHaXxOs9tOkZhUv28EeCmXO/7O0FwphfJPRW9tBJzbT4YV7+XcZu2+VyU9g8AAFoMHHeez159RkTdNUtE3emLTDZGRP1b/fOkd6oF+qHfD10DUKLV/UR32rH3N2XEba94SJFYwvnMOPqlAXz4e9OHTVwhvU/5+DJlsusUTa71tNLE+tU1djrNm63tHwAAgjBxp8vTFp9+3d3h1mnXXK/LdSjciS6tPHSquqcyoF+ffmmCTNQvzRVPPdYuSrRTvCJ1SpIN0CT6w56G9CpXUP06pk1Nbz8AABAGgSJwqXTc1XHe31bFDsI115M9d6j89H9ORDvFK61TGdAfvn65XslU/W/fv4uwSeCp1MTWNt0NMD383wn0h547jXr1dk4PpxcE0a/rwWUe7l8AAAhCoAjc9fGu63etRttZN8SoT8ZyAEwkPtIaBZJrZ2zSz4MYT4fZol9dsM9lCNJ+VHMy7TqW0TYJ51bjqM6k+lUDF1ZES7YhW+5fm9oPAADMmokicOqur1ajTTflupOiYKhjFJ2rLqR+Xvhsk34VG/S/fP6iw+u9llZirqOMgujn6zjNxf88oBeIOufpOEViCeq0a3SaO+pbP8Umbxr1H+baLC4fnVSmph/tBwAAwmPiPHCys5Sdp5qDiTvM+9uq67UfvvlCa8Ft18+MOiTdS//d60Mn+hPm2ZVE3Wm7aHKNUuk4ZbLrdHlSMbb+1UPTOTomf/gkgEn1q6YtTBMxDf1hY1P7AQAAIw2cXBAsB6FWo93XOaod5w/ffKE9mabt+gdFb6T+ROIjSiQ+otX0vvO+rz7Zpp3ilSuNRJiDr6x/Xqc0af2HtX6s066NPI5q0vbDn9e1MzKofrQfAADQw9hTqHIq49mrz+jyk26nelOuO0/EqTQRKZ0od7ZsJkwwP9HkGrUaJev08/RXRgxm+fiy2CVJtJH4yNltyNnn78qvqVDv/rdLyUmPEQanuaPucU7kXmQ+Sf2HNfi+ff8uspre74y65kHajwn3gg3t38b2AwAAs2KiCNzSSoyevfrMtUC4UG9Sq9GmTHadbsp151gbtbM1reNk81OoN2nj4IwK9SYtrcSo1WgP1T/OMUuzgtcBRZNrtFc8pOvjXSrUm46RW90/6otcEHUX4N/fVj0X58860qNGsjh6YnL74UjZsPfY2v5t0W9z+wEAAGMMnOwQ5S4wTkaaya5TJrvurFeRyPfrNj+RWMJlfs5zm5SPL9PGwRktrcSG6j/PbdJ5bpN0mTge0C5PKs6gFk2u0V35NV0f71Imu+65A49RE5yGpXmneNW3TonN0aTtR9cRTtPSrxtb9M9r+wEAgNAMHJF7e75cT+XXGOiMXrH5kWWIJtcosbVNe8VDOs9t0sbBmfEXTy5CP80dKbmu1vrev5red12rYYd+z1LzxsEZ1S5KnuvK/LYfU7Pp6zDGi6R/3tsPAADM1MDVLkrO7i7eBcaoB0hL5FmFJgwEq+l91yDg5IcSB3+bql81cRyNUzWf5o5oNb3vrHtT85bpjKR4ZcMfp/1wuU2KntjS/m3WP8/tBwAA/DJRHribcp0SW93o1V7xkE5z3bVWMjUHJ5j1OtLGJHaKV06GfY7IcXnUQUDVP6vzKycZ0F4+f9Ep1JtUODiju/KaU45CvUnXx7tOOTYOzug8t9k9OF3j4OX1d8dtP6YNvDa2f1v1z2P7AQCAcRg7Aue1mJh3hsmnX0Ym3DTF8KgduDRsarLWYfpNe3q/Pt6lu/JrWk3v02p6v+/A8Xx8mc5zm7RTvDIy8mBb+4F+6AcAAF1MFIHrTWF0SCQ59drdxU+8nHNJPiGbYh44JUdB5EpjMzRMv0mHYasnY/B0ae2iRDflutH176XfpvYzqX6TWET9iL4BABbSwKkdoNeGhPvbqjNNJztPU5+C5dmifvSbPgDYVv/QD/3QDwAA/nk0rS/yOsqGpyJT6bizeN7URcPQD/3QD/0AALBwBo7oYcri/rbqrD3Jx5edztP0p1/oh37oh34AAFgIA8frT+TZopcnFdfTr8lAP/RDP/QDAMDCGTjZSS6txPrSU8i8Y6YC/dAP/dAPAAA28TjIh9WnX6LBGc6jyTXKZInopEIFopGHg+t4eod+6Id+6AcAgLk3cPLpl6g7fcEHw/PO1Faj7XSw3Ilmeu/fODjr6O5EoR/6oR/6AQDANgJ1Xi+fv+hcH+86nSNzf1t1nSXq9R6i7tmcOjtQ6Id+6Id+DAMAABsJHIHjnV/R5MPvosk1Os+1aaeX6PehMzXvgHjoh37oh34AALCNwE+fL5+/6JznNomo/yDpjYMz459woR/6oR/6AQBg4Qwcd6Jev7el84R+6Id+6AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAwtV1ag3aCSUzeFQb90I9yQD90AwBsIXAiX+548vFlSqXjrlxMRN18TK1Gu3vItIFnEEI/9KMc0A/dAADbCHyUFnc8ia3toe91dUT1pjGdJ/RDP64D9EM3AGBhDBx3Ppnset8Zg8M6ISKiy5OKMZ0n9EM/rgP0QzcAwDYeBfmw7HwisYTzMwh+bya7bkThoR/6UQ7oh24AwMIYOH569Pvk6NUJ5ePLvhbuzvLpF/qhH9cB+sPWPy/tHwBgoYEjIkql44H+cNDPBwX6oR/lgH5d+uel/QMA9DHxLtSllZjr3512LdDnwwb6oR/lgH5d+uel/QMA9DFxBG6S8P80PjstoB/6UQ7oh24AwMIZOAAAAAAAAAMHAAAAAABmaeA4J1HtouT8jIPuaQDoh36UA/p16Z+X9g8AsNDAtRptpxPiLOL8b6+Oyus1nUA/9KMc0A/dAICFMnBv37+L7BSvXL9TO6H72yrVLkp0eVKh09wRtRptz45JB9AP/SgH9OvSPy/tHwCgl0CH2audSjS55upYjl99TvSK6PeZj4nqTboT5/1dnlSMeAqGfujHdYB+6AYALIyB6z1FdvLxZSIqUWJr29X5RJNr9OZHT4mI6K+J6Me5guvzus/yg37oRzmgX5f+eWn/AAB9BNqF+vb9u0ih3qSbcp1Oc0fO77kjevJ9978ffBinP/z2jXGFh37oRzmgH7oBADbyOOgXvH3/LlIg6j1JPjw9Mk++r9Ltlz93fcak9Ru26+encejXx8vnLzo2tyPoR/sHANjHB9P4kqd/9he/+O4f/0RPm/+L/vxf/nN69L//J/2L5//K8721ixJt/d1/MSr8b6P+l89fdJ7+2V/8Ih9fpo+if06FetNa/d/945/I1vbDB5P/w/959Iu3799F/uH/PPqFbdcB+tH+AQD2MZVOgDtRSSodp6WVmPM0eX9bpVajTTvFK+M6H9v0s95Mdt15YpdTMLbp91qQPUw/ERnRhmQ5uAw//fZ3kS9/8nHHtusA/fa0f5g3AMBUDNzL5y8618e7zg4q3ll1U657vr9QbxozANuonzv/veIhRWIJIuoehM3TKn7066z7aehnTDAQ18e79OzVZ0RE9MM3X7jK8Fd/+8ZlJky6Dqp+r2swSr/ua2Bj/XP7//Trh8S9k7R/mDgAQKBOQO1AZUfEqFvlb8p1Y3ZQ2ahf1SwxXT9rJ6LA+vPxZSPM6F35tWNExymDKWa6VvvO2msQpP51GKFptn8YOADAxJ2A+iTZaddcr8uOiDuhpZWY82/dUwG26h80aKmYpl8OXtHkWmD9ia1tWk3vG2Pgxi1DNLlmtX7+t+6pyCD6w9Q+7fZv0lICAIAeAu1CTaXjrs7n/rbqrNmQO6miyYcOKZpco2iS6Lzb+Xd0dkC26Zdr9QZ1+ibqVwevaegnIro+3qWNgzOtbairefwyyLoxST9Rd6F8Ymvb1zXQfR9PWv/RJBEVr0Kp/1m0/169a28/AABLDdzSSqzvSTGaJM+nS9khRWIJWt1PECnHyYSNTfrl2rFhT+om1//lSYUK9TNXyoS94qFr/Y9f/V4DoA4uTyq0V5SD7RrVLkq0U7winp70KgMROfVQINI2CKv6ibrHOp3mjiiVjtPq/tHQa7C0EutOpWoqw6T1H4klQq//abZ/E/pPAICFBk7dtdlqtOmmXKdUOj7ys7Jz0oWt+lXzZoN+XmfVadcokyWik4prI0Kmt3FklP7V9H7f7ziqoQvOPZYRkROiwQvQvQxoKh2nvCYTx/opd0SZ7LqrDKl0vGuC9o+GtqFocq1roHJHoZchSP3Lcs6y/mfd/jcOzjCKAQADNx6ys5Gdz/1tlZ69SvQNVvyUya/xjjEd5u2u/JqIyHlSz8eXjdb/8vmLznlu09HHa2i++mTbGQzk66bp77RrFIklKJok2iuuuQYtHoCG6U8kPnJdI14LZMp5kGoUKJNdp1SjTYnER87v7sqvXdfgNHckDHmJqN6kl89fdNiYhG2CCgdndJ5rO4eqJ7a2KV+uUyLxEbEBUdtQ7aLkpLrYKx46Jk79fhPr/6tPtkOr/3lv/wAAPUzUUck1Hbygljsg7mDkLisvs7BxcKZ1EwB3lpe9J+JJ9Ic1QA3SLJlEP+8inGU52HwmxEHcktpFqS/6oOrnAUw+PPDZkbrakdf9IKNA6nq31fS+K2J4eVJxRb3uxaCuc5ewvFZq7j2O+sg2dJ7b7MtXxv1CWGUxuf79tP9R/afp7R8AYImB4w6JOxmOAsmEmpyEUiI70rCjDMPMkJyCuD7e9a3fWT8TQjqCQQOUHHDGrX/5RE80292EHNmQA5mcRlxN7w/Vz0aBkYbPlMSmXteIYfOgXgO+j7zQ+YAjtQ4yQqxPTUqrqywm1/8itH8AQPhMdJg9mze5kLxQb1Kr0aZMdp1uynW6PKk4299lp6qeeKADPrUgmlyj6+NdOs9tUj6+TBsHZ2PpT6XjdJ7bpPPcptNJzwp1uiSaXKPEVnca6Dy3OVH935TrtLQScxaiz6oMb9+/i7x9/y4iIzncdvhaDNN/V35NO8UrRyu/Z8egRdxv37+LbBycDTyn0usa3JTr1Gq0qdVo0+VJRfuUGD+cyXJ0dz0+GJ+78mtXbjI+kJ2vl66yjFP/sv2HoXkR2j8AwBIDJztD+eTNi4cz2XXKZNf7UhGo79c10MrpR9UIsYnzoz9MA1SoN/uOy+LF2PxUP079Z7LrtFc8DH2glWU4zR25pqtG6efBttVodxefG/Aw4BW5qV2UXEbiPLfpWoTO10CdBmejrnNa7KZcdyLRwx7ght1TOsvip/55KlWH5nlv/wCA8Jh4E4OMvp3nNp2nwVajPXBaQn3a1xn651xXbIQ67Vr33z6fann9zGlvB18oxlPZcac+xY9T/901QA//H5p5JuoUxGCqtoFB+u/Krz134pk2fZSPL4uNMQ/JbnnaXtW+U7zqnOc2jZoSazXaVKg3KSU2KUgj5LX715SymFz/Xu3fq+5tbv8AAMMNXO2i5OSHUgd/7vDvb6uuxJRE5DprVCfccd/1DJxqhPzo12WANg7OOvl4xdlBx0/x49Z/od4k6q23kU//YZRh2OvD9F8f71pxoLeT3qF3XaR5UO8BbosmDchLKzHHMKhGiK/BsPtKd1lMrv9FaP8AAIMN3E25TomtrunZKx46xkcuipedkHy6NAmZykE1QqP06zRAXk/x6qYEP/VfqDedQU7ngMsL4W1rP8PKIDfKjCqDKZsw1GvgRH16bWSYeTOtDdlU//PQ/gEA4TP2Gjhe71K7KDm/YxMkp1sYGZ0Ky+SMU47V9D6tpvcd86ZOtQzSz5/fKV7RTvEq1NQPvCiaf9Snd7/6B32PzsiPLe1nXsug6r8+3qV8fNmZNrVNv031Pw/tHwAQHhNF4JxpB7FezGtBLT8xcs4x+YRpgmFgDYNSIQzTb0oZhjFKv+nYrh/XAPoXvf0DAAwzcKp58dp9eX9bdeUoC3uqMSjQHy7q4GSTfq8pMJvKAP1o/wAA+3g0rS+SR1ExPC0pE1PqyjIP/Wbq58FX7rxTT5uwpf5tLgP0o/0DABbUwBE9hPy5AyLqTq1y52P60yP06xt8Ve08eJmunwdgr/q3oQzQj/YPALCTx0G/QD5BcpJJDv3LyJCpQL+Z2vmYJhvW/XCExKv+5XFNPDCbGr2CfrR/AIA9TCUCx53M0kqs7zBoP0llTRgAoN887abrl+cC21j/0I/2DwCwl0AROK/1G17H0xB18xplskR0UqECUYfInPxL0G+2dlv0bxyc0SBd0A/989T+AQCWGzj5BEnUXYOSjy9Tod50dqbKo2G4E8o8dLgd3Z0Q9OvTP0i7BPqhH/rN7X8AAPoIPIUqOxc+FF6elchnpPLuyGhyzfkxAejXH31g7ZyHT6al4YXbNurv5UuEfuifq/YPADCDQE9vvAaFiJyD4ZnaRckxD8PQPY0B/eHr96ObF3HbrF8djKEf+ueh/QMA5sDAqZ2RPArm/rZKGwdnxncw0K9Xt3p8EJ9Ja0u9Qz/0L6J+AMAcGLhhT7m2dELQD93QD/3QDwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAClPb7YScRXqxvf6hH6D9QD8AwD+Pp3Xj5uPLlErH+/Ia3d9WqdVodw9qNvgMP1s7INvrH/rR/tF+oB8AMD6BT2LgG1fNKK7iupENSlQ5VgfUO6fQJO021z/0o/2j/UA/ACBkA8c3bya77vtcPj7P7/KkYsRNbHMHZHv9Qz/aP9oP9GMIBmByAh1mL2/eSCzh/AyC38uHNpsyAIwavFj70kqMMtl1yseXfU05zRqb6x/60f7RfqAfABCygePO3++Tl9dNbMIgYGsHZHv9Qz/aP9oP9JvwEADAwhk4IqJUOh7oDwf9/KJ3QDbXP/Sj/aP9QD8AIBgT70JdWom5/t1p1wJ93soOqLeoWwe21z/0o/2j/UA/AGByJo7ATfL0Po3PzrID4h8bOiDb6x/60f7RfqAfAKDBwNkOOiCwyKD9AwAADBwAAAAAALDBwHFOn9pFyfnBU3x42F7/0I/2j/YD/QAADQau1Wg7NzHnkeJ/e93oXq+hA5oc2+sf+tH+0X6gHwAQsoF7+/5dZKd45fqdehPf31apdlGiy5MKneaOqNVoe97Y6IAWr/6hH+0f7Qf6AQAaDJwcBIY9lR+/+py+/eVvqFBvknrDX55U0AFNYRC2sf6hH+0f7Qf6AQDBmDgPXG8Q6OTjy0RUosTWtqtTjybX6M2PnhIR0V8T0Y9zBdfnTTgLz6sDkmU4fvU50Sui32c+Jqo36U4cOaS7A7K9/qEf7R/tB/oxBAMwOY+C3sSFepNuynU6zR31PZ0/+b773w8+jNMffvvGqIJzFOKmXHfW//R1QPGn9Cbe7YRM7IBsrn/oR/tH+4F+AMDkPJ7KTUzUexJ76PyZJ99X6fbLn7s+Y8r6B0c7Ed2Uj5wzHu9vqxRNrtGT76v0f3+09tABbf3czE7U0vqHfrR/tB/oBwBMxlSeoPlMxHx8mVLpOC2txAbuUqtdlGineGVU+JzPhuQBbNQOu/vbKm0cnBlZBlvr3/b2g/aP9o/2b6d+AGzlg2l8ydM/+4tf8BPY++//kf7h9h198P/9QI/+9/+kf/H8Xzmd/vf/7b8ZefM+/bO/+MV3//gnetr8X/Tn//Kfu3R7dUBbf/dfjOtA375/F/l//5+VX9hW/7Lzt7H92K4f7R/tZ9HbPwC2EpnGDXx9vOssgOaF0Tfluuf7C70DsE25idUOiFGfJLlsJnegP/32d46uL3/yccfr/fI9JkVNeBF0q9Ee2Ha4/ZjUdsZp+6bpR/tH+1n09g+AzTyexg387NVnREQUTRIRddc3ZLLdw67VnW55YeJMNhDdTqhORBVjL56qP3Nb7bB+r4Hq5fMXHY5WmFKGTHa9r/1w2/FqP2RQ2xm37Q8b2HSV4a782lmTJAdgW9q/1P/f0/EO6ze9/dvefuah/QNgO5EgN3A+vkyfft3dwdZp11yvy4WqfCMvrTzc2CY8yaudUKdd61tgq3ZCJkUgbNYfpP3oXn81L22/VvvOpX9U27kp142JoMyjftvbj036AVh4A3ee23QSgPKNO2jxKt/U/Lruxaw2G4h50T9p+zGh7cxL21fbjW0Gwkb989B+bNYPwLwQaAp1aSXW11lGk0SRWML5HXew8uaOxBK0up8gUrJzh00qHXcNALITknqjSXcndJ5r007xSvtUjO361fYj28ew9rO6f6St7bD5WdS2H00SnRNpbT9sIGzVPw99p+36AVhYA8eDmLx5b8p1SqXjIz8rb3Dd2Ggg5kG/2n5kpKS7lsaO9mNj2/cyoK1G24lQwUCg/SySfgBsZuKTGOQNK29g1VDwTXt/W3W99sM3XxjXEfUtmLeoE7JNv2w/GwdnzqA8SK9sP7rbju1tX+rnAdiWtuP18Oj3WC8T9dvedy6txJxNabb2/QAsnIGTa0rkrtJWo913g6o37w/ffGHEOizu+KPJNVpaidFNue6rEzKxA+IdXrbo5xQVcudjq9H2jCiq7UdX25HRK9Y+advXaR743r08qbgOGbfRgMqdjbbo54TJqmm2qe/02iBik34A5oGxp1B5/QkR0bNXn9HlJ9vODZzJrtPlSYVSaSJSbmSexlhN7xMRmXGOIlEn49JXoY2DM7rulc00A+EF52Aq1JuUJ3Lq3lT93H64PcgBuBuN6G87avvRWfepdLxP+7htX0f7lylnWE+hfuYyRK1Ge2TbISJjDCgbaO6PxtGv+/7tPgCUnPvWT/s5zR0Zk4JJ9j3dtuTuf2zQD8DCGTiOnjx79ZlrEXGh3qRUo+10RER1z2NV8vFlo27iy5MKffp1tyyZ7DoVDs4cE2eigVCfgqNJ1nbmqxM1QT/vXmPjKc0R5x/jtiO160QmLSXq7qRj7eO2/Xx8mQpEnbCMHJtmqYcPH3/7/l3kplzvjGMguBycRDfM9pTJrjt6Ng72xzLQ0kDozAentme/7UeX+ffiplynxFa3LPl4xalX9f41VT8A88BEU6jypuTpABmRyGTXKZNdp8TWdt8NLN+vm7fv30UK9Sb98M0XFIklejs0N52ndI40mGAgBnWiDOuWHafXrjzdJkjdvCCvA7ePveKh03akdn7aZ+Ogy7zJuufBiKeQ/Lb989wmnec2Z14WmfJB6pH50Ar1pqP9plyny5OK2FTi3XbOc5t0fbxL18e7oVwPbjteesbV79UGTbiX/bafsNv/sPuVdckHc04sbnLfD8DCGjgid94xNg8cFfLbIZtSCZcnFWd6JbG1TdfHu1SrfUe12neu6SKv9Vm6O9HaRcnRnY8vu9Y0qQOYCfrl+qXu0/ty39SYSfU8KGrihdcmjGED9k25HoqJk/m6BtXvuAaU75vLk8rMy8Dtw8sABDHQOh4EpHlU28s47ccEuO+JJtcok12n6+NdKtSbI09cMKnvB2DhDFztouQsEL48qbhuWPX8RHXg8GvwwjZCcicb6//qk226K792rV0y8cmd+fTrkmM6TTRBqpmIxBJOImKVYW2HTZ+OwSoSS1AklhgZTfDT9jPZ9VAGbal9WLsY14Cm0vHQyiCnTgeZ0HH16zBxst1Ek2t0fbxrRfsfVIfuHHtrdFd+TYV604q+H4CFNHA35boTgdsrHg6MrvCNyz+m3sBqNIuoG2GUZTPZfEq++qQbiVMXmpuo/+71IX3V2wTD02BMq9Gm09wR1S5Kfdr95JyalVHutGt09/qwL3WF17pO1i7P2FUH8jCuidTuN+2GnwFY7madNfJv+3k4GaU/LOM5rByy7vy0n6WVmGsdpU4Tx32PWh5eW+mlHwCg2cB5mR02Ol6LVmXnbuphxjy1sVO8cpWLO/58fNnVAZk6BcCmU40OmdSByvpNbG17rqGMJtcosbVNqXScdopXfVFe3QZfnZJUB2eORiytxJz1WF76B/1eh3Y/BkJ9L5vBMDYlyXrya0JHGQgd94R6veXDiExrNKj9mLaObFB5VP08PsjlNgCAkA0cDwo7xStaTe87P14Lg/nG3Tg46+0Qi7u+w6SKSKXjdJ7bdJm4+9sqXZ5UnMXRRGYugFZNJ+tcTe87kQgTzDO3G1m/nNJBTmWz5sTWNp3nNqlQb1Kh3qSd4pW2+lfbvNwEwP/dKV65TEE0ueaYUDY+XM6NgzPaKV6Fcrj6MO1Sv18DymVg/bO+n0eZUDUa5MdAh2Ge/Tz8clm8Ilqy/ci+05Sd/KxZRt3kteGHebkul00c1sEBEJzHQW7eYRGp+9sq3ZTrTrifOyDTonDqwmI2ca6jdhTzaRK9wblz3us8penM9MyzrH9T9HL9qkaiQNRJNdpEVHUicfleO3KiPyGYnlFtflhEYmnl4VxOqV81fKZp3yleUTdHnzQQbef3437fLNuNlwbOI+iln+9xx/yEYDwnKYefaV1Od2TCQzDfswWxTli2FZleJJON+S4jAGBGEbhBESw2burNK3N6FTQNvqO0J7a2nZ98fNnV4cvO1VQjxxEWde2baXn3uNPnn0HRInXAUj9r4jXgulan90xtM16GTD2NhCMqO8Ur7Q9fst2obYCjQapG1s/XgP+rsx0NK4fXA4GKiWtxuf1fH+96TtPbcA8AYBuPp/llvNCWo0B8U7N5MzX6ph7sLY1mgWjo1n/d+rmO1d1tqpm25amXr0mrF4WziVQ67kR27m8fonA2RRw4qSxHsaQxNfHhy0v/nvi3qbux/eCcsNLrf+Sxc8a2fwHv3pdjAFE4m14AgIEb0wTxgeo3YsrL9CevTHa9r2NUp7sKRJ1zw8ohj0aSRwt1qbqugy0Lh2WZZHl2PKZbTdQtzQ6dVCiTfTDTfPqCyWXg/1engdmY2pJBX5pnFVPNj5d+r/NGC5qmfv0gTZpcF5dKx119bMGitgTAXBs4adJ40TDfoC+fv+iYGn2QZ7pK3YM6R7mGQx6FpLMzlebNbUCvBnaspqMeVC6PbrJBN5sdjmS1GiVaWok565ZMvhdc90HPgNrSfthEF0QEVEZ7TDc/6jpiXkPMD5RkuHY5SyGPyJO/h3kDYLo8msaNKzv4QQMtZ+vm/EU6dyEN0+2nc+Edq2Edh+TniVed+vVaX2NDLqallVifYTC505fmZ2kl5orwqNEeUxKwDqp39agt23J3eeXWk5tfTF4/qZodtS81XbtXOhT191gHB4BBBk69KVuNttMJ8UClbovnI1fCOkNxXN1eqAlzE1vbzoCtKzrx9v27iDyrNbG17Uo8LM0Fv0eaCFONBHf+Sysx2iseOtO/JmtW2wC3JfVhJpWOG1v/fJ8OyjNmersZ9IBiU96xcfokEx9gWLfa7mVfqbvfBwAGzmPwkiZCHg/D65fUI1d0H7Cu6vaTIFM1o17rVHQPWnfl164OUpoLeX1MzMXklQuLz6aVJsJE48DtIZNdd4yaRN4fd+XXfddJN5yfj8+nVbWzmTb1GnjtXuY6vz7eNTr6qSL7JJsMqKxv1s2JuOU9DRMHgCEGjjcuqDey7Hg2Ds5o4+DMlfhX9/miqm4+l3BYx8JTYve3VapdlOg0d0Q7xSvSmY6AB95Bu+04oiWPNPOKGpkEd/pSr8nI5MQ8iMk24/WwYlK5eHqOU9EM0i4fAEwegFXdbEBt1M2GyFbdROTrgHsAwPgENh7qZgCZwmLDkGST4+heTe8P1OzViZpQvkG6/HT6Nizotl3zeW7TMXWcYsfUdX2yHLwj2Cuv17D7RLd+6DZLty33MAALZ+CGDV6m36S26gZ2YarxD2JKTdY/j7pN1m6rbgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAD6a2O8jWlBXzxjxcB5QB+gEAAAwn8GH23NFzLiD1TMX72yq1Gu3uQca9A+DR8c9uwLX5OqAM0A8AAMAfgTreUUkcJa6O3/DDyW2LPMzDdUAZzEgIPW/3MwAAwMAN6Owz2XXf55ry8UEmZqIfK/LQO6zZpEHX5uuAMugvw7zdzwAAAAM3pMO/Pt51OvtILOG81mnXRnb6Jh2zZXPkYR6uA8qgvwzzdD8DAMAiMNFh9mx4/D6pS/gz+fiyEQc0y8jDKPPG+pdWYpTJrmsvwzxcB5RBfxnm6X4GAAAYuBGk0vFAfzjo56eJnDaKxBLOz6hBK5Nd1659Hq4DyqC/DPN0PwMAwCIw8S7UpZWY69/Dpln8fN7GyMP9bZXy8WUqEHV0TR/Nw3VAGfSXYR6uAQAALBITR+AmMT3T+CwiD/N3HVCGNegHAAAwFo8XvQIQeQAAAACAbTxa9ApA5AEAAAAAC2PgOH1A7aLk/MD8hM88XAeUQX8ZcD8DAMCCGLhWo+10+px+g//tNTB4vQaCMw/XAWWAfgAAACEYuLfv30V2ileu36md/v1tlWoXJbo8qdBp7ohajbbnQKAbmyMP83AdUAb9ZZin+xkAAGDgfD61DzMzx68+p29/+Rsq1JukDhCXJxVEHqZYhnm4DijD/Oh/+fxFh3/QzQIAgEEGjp/ab8p1J2olzU00uUZv4k/pTfwpERH9OFdwfd6EY6jmKfozD9cBZdBXhmnqf/n8Rec8t0nnuU2c0AAAAKYZOO70C/Um3ZTrdJo76jM1T77v/veDD+P0h9++MbYSbI+czMN1QBncyAhWWAZoGvr5TNXE1jYtrcQolY7DxAEAwAwInAfu7ft3kQJRJx9f9jRAT76v0u2XP3d9xqRpyF7koae/RImt7f7Iw4+6UYe/JjOjP/NwHVAGtwkiIjrPbRIR0U25HtppH9PQrz4ApdJxonoTvS0AAEyRqeWBK9SbdHlSca0p86J2UaKNgzMjTM8sIicmlMPW6/Dy+YuOzWVg4xWkDHy82135dehRrKD6OfqmclOuo6cFAIApM7WTGPiJvdtZ1ymVbtPSSsx5Gr+/rVKr0aad4pVRpmGakQcTzM/b9+8iFF/u2HYd2LhQfLnz029/Z10ZVP2TXAf+jkx2ve/7Zx3FCqpfPVd43N3cAAAAQjZw/NTNh7vzejLu+IkqA82GSRXhRH+IOnRS6Z1xWh2YJqR2UTLGQKiD70+//Z2j6Uuijtd1MM28yTbUzK53uB391d++iQwqgy36h10H/jzRw5SpNEnMLKNY09DPxlPVXOiZThMf2gAAwGYCdarc8T979RkRdc8RVaNS6gYB7tSNjP4Q0U+//V3ky5983JGRD5OjP+rgK+ucB1/Jlz/5uGPSoOrVhlTzorYhk9qRqn/c+4BNG5+p63Ud2bzNorxB9efjy72HHYJxAwAAGwwcm55Pvy65Bl7GawDmQcomAyTNnMRE8zCu+TFhgH35/EWnVvtu7DZkSjsapt/vfcAmaGkl5uxqLnhMl86inNPUD+MGAADhEWgKNZWOuzr9+9uHKUc59RhNPgwE0eQaRZNE50S0U7zq6B58pQGKJvmVrtbm2X/sDDJApqCaNzWKs7QS6xt4M9kYpXqDr27zlo8vT9SG+Hc625GX/gnvA8oTUaF+NVOzNnv9TRg3AAAIiUAROHXHWavRpsTWNkViCed3Xk/1/Hoi8ZGx0RNboj935deeA++gSIp8Xfc6Pk74KuuVNfptQ512jVbT+6GZHj/6J7kPoB8AAMA4TBSBk2vGuMO/Kdf71sJ4OkYxKJiA7dEfr52wXgOvLI8z8G4RkaYoHOuX03FE3ejmXnFt7DaUjy9TgagTlpEYpn+S+0CHeZumfgAAAOEycR442cnLTl81FNzR399WXa/98M0XWgsuDZCqLRJLOD8PJm7NMUH8Gh+7pQt5DVqNtq9TIUwYeLnu1Ta0U7yiVDruuw3J9pbJrtP18a6TL22WJxiM0m/6fTAL/Yi+AQCAJQZOPrnLBdetRrtvUFI7/B+++cKIBKy2GyC+BpcnlUDmRwd7xUPHAHMb4qiunzbUadeo067RxsGZ632Z7Dqp53DOwsgN02/DfWC7fgAAWHTGnkLldTNE3QX0l59sO0/wmew6XZ5UKJUmIqXz5+iVrvVKowwQp3S4v63Ss1cJlwGSaRXkazoNUCa7TtHkGtUuSn3mh775wpUWQh14+VpsHJw5U49hXQ917aRcS1gg6uQdcz24Dd3fVvva0cbBWef6eNe16zaVjtM5746cUhn96Df5PrBdPwAAgC4TReCWVmL07NVnrvVjhXqTWo02ZbLrdFOuO8fwyE6fiFxP+TrhbPdBoz+6BmCuU5kj7KZcp5ty3SkD//A14M+c5o5oNb0f+rXgTRdsLgcZYE5JMagNRZNrfdrfvn8XkdE4rgv+vjD08xFUpt4HtusHAAAQ0MDJjlwe+8MDZia7TpnsOiW2tvt2RXodExT2ICYjiJMYoNX0vhOBmPX5lKp2deBUUzfIfGJy8FU/c57b1HYtvHY0Sjiam8muu5Io+2lHaooXXtsVtn6T7wPb9QMAAAiwBk4OAmyIiLwTxw4yI7oK7RVBlAPTuNGfMNkrHroiKOoh56MGX542VVNHhEXtouSsy7s8qQzMqee3HUk4gsSbalLp+NQTy85Sv+31DwAAwHADN2wQUI+dksizUnUyKILI5fEb/cnHl2e6UN6PefaaHhxVx3vFQ4om16jVaE9tetEvN+W6o3+veOj5Ho4iynbjtx2xidspXjmRt2lOc/vRb/J9YLt+AAAAAQzcoEFAmgHZ+fOPSZ3+oAjiuNGHVDru7HoMw8T5iaAMG3z5O+5vq6FH4dhc1S5KLjM5zGhP0o7evn8XkT9h6fdKz2HSfWC7fgAAAAEM3LBBwCtiJVNzmHIE1SgTNE704aZcp6WVGC2txPqmM3VEUEYNvvwdflKmzMpE7BSvnHWEq+n9vgiZye0I+s06Sg4AABaViU5i6A0CHZnF32tdGBsdXnclzYXO9AM35Tolth5M0GnuaKABUvOnSfPGqTxOc0ehLOrmVA+pi5KTw2uveEiF3oaKYYOv1MdpIvgEDR0mYtBrw6aEvdqRLhM0zvuhHwAAgBEGTh0EvKJO97fVbv6tXooO7vR1P72PMkGjDJA8daL7+/4IRQgRFJd5fvv+XeTl8xcdP+bnPLf5kPx2ygv8Z4Gp7civAYV+AAAARhm4QR2/PE+UdwDyonTOuabbMHiZIK/Ba1T0oVBvEp1UQh/U/NbfoME3H1824jpI1OTKrJ+TLJvYjqAfSXwBAMB6A8dmZ2kl5nT8bBZ4UDDpqV0dfGQUkU3o/W3V2cl4ntt0Bi/OXE9E3QPUxVFiJgxqNpjoQQ8Bahti/aa2I+gHAABgpYGTT+6tRttZVyWNg+moZSAiujw5csrA5s1r8DLBCAXRb2L9q21I6mdTYWr0CvoBAACEwaNpfAmbtKWVmNPxcwevK2HsopUB+qF/0e9hAABYJAJF4LzWzRTEdKIkmlzrLvg/qXSnHcm86JWNZYB+6F/0exgAAGDgAjy5E3XXwPECeV5Txmtq5ACQ6b1/4+CsY8IAMKgM8ncmlwH6oX+R9QMAwCISeApVduyJrW3aKx7S9fGu8zpvAuBcapxd3+uIKt3RBy4Dpwx5+fxFhxOfmlgG6If+RdYPAACLTKAn55fPX3T4GCrOqcbULkqOeRuGzqd3P/o5x5qJZYB+6F9k/QAAAAM3pUFAPYJq4+DM+M6d9asJfE9zR1bstoN+6F9k/QAAAAMXcBCw+ckc+qEf+u3VDwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYEbMdBeqxOQdbdAP/dAP/dAP/dAP/TbpfzwN4fn4MqXS8b5cUve3VWo12t3DsQ08OxH6oR/6oR/6oR/6od9G/ZEg4lm4msVdxVUQQ5KDQj/0Qz/0Qz/0Qz/026o/EkR8Jrvu+zxEPkfx8qSi/SJAP/RDP/RDP/RDP/TbrH/iw+yl+Egs4fwMgt/LB2XrBvqhH/qhH/qhH/qh31b9Yxs4dp9+nadXIfLxZV8L/2bpnqEf+qEf+qEf+qEf+m3VP1EELpWOB/qjQT8fFOiHfuiHfuiHfuiHfpv1T7QLdWkl5vp3p10L9PmwgX7oh37oh37oh37ot1n/RBG4ScKH0/jstIB+6Id+6Id+6Id+6LdZ/yMCAAAAAABWAQMHAAAAALAIBo5zmtQuSs7POOgOg0I/9EM/9EM/9EM/9NusfyID12q0nUJwFmL+t1dBvV7TCfRDP/TPp/7V9L7zY4P+neIV7RSvaDW9j/YD/dAP/WMx9i7Ut+/fRXaKV53r413nd4mtbbq/rdL9bZWiyTXX0RFEFUql4xRN9hdMB9AP/dDvX3+hftZ7V/e/d+XX2jvUneLVwz/k/9OZS9/GwRnl4+PXv5qjKUjWdK98T1K/1Lua3nf+jfYP/dAP/VM3cNKFqmFBKez41edEr4h+n/mYqN6kO3Fe2OVJxQgXDf3Qv2j62VBsHJx5GKAHo8ac5zZd295X0/uUjy9r1c7GhzOfq9v4uX6vj3e75Ryj/vlvKEawM4mJe/n8RUfq9NKq6l1N79P18W6g9iPraVZHDuH+hX7o169/IgPHLrTbkZccByoL8+ZHT4mI6K+J6Me5guvzus8yg37oX2T9bBaiybWBJoifFHm9xmnuyG2KxjBb0yjry+cvOue5TdfB0YPyL+0VD11Pun7qn/Xm48u0Vzyk+9uqagTHMnHSvI3KE6XqnbT9TNN8+o2CnosIBO5f6If+cPU/ClKIQr1JN+W607nLTujJ993/fvBhnP7w2zdkGtAP/Yumn4+BuSu/pmevPnNM0CCDIRfb7hUPHaMx7Pv55678mq6Pd+n6eDfwsTHSvKnnDfLURe2i1Dc1wU/Jw+qf9ebjy3R9vEupdNwxb5nsOmWy631P2+Mg61bVOkjvuO1HloHN2+VJhS5PKhPXv7yW6o+8tjvFq6m3f/m3cP9CP/RPOQLnKgRRR06pyE7/yfdVuv3y530drlEXwWL97Oahf370T3P9lReZ7PrAqJCXNnXHFJsMqUuNXvF3BYlgqSytxFy6eZ0JEfXWmhCl0kStRsmZ8t0pXtFd+bVnGVXN/N3R5MN7ghg3GcEcpLX7NwbrHdV+ZBnYaErzOWkZ/Ez9qtPUmTHb/zBzFkYE0db7d570z2L8XbT6fzytQtBJpXfGV3XgNtnaRYl2ilfap49s1y877kK9abV+W+p/2IATRL/X9856AFOjQsPgLfLSZKi62UBwuadhIobpvr+tek/j1pt99ehV/6pm1RhenlSoUG/See/MQjZd4w5OGwdnnfNcu7+teGgl6q43lNPWg9qPjKZO23z6nfpVp30vx2j/ajR11LrAadwDg+5f7kNtun/l9bex/7G9/zSp/iPTLAiTSsdpaSXm6tBbjbaR5s02/ayXB8docs0VwoX+2WhWF/OrA41f/V4DCA/CPJjJ6FUmu04bB2dTW0fGa99U88amxQ98/eQ0rGoIHwZ0cozfpGXwqn/ZSY7Tfvh7vDpZad68DNk0286k+tno8esDzWdu0zGf46y5YQPnFTVoNdp9dceDkuxDR+lXv9/rGkjzH/S+H3b/RpNrVLsouUy6qfev2ofK+8sm/Wo51CgW6t+//sfTGhD6pwm6W2i9PmOKibNNv/rUzRecF13bql+N1IzSH0ZofFAbGbaAXw6ag/RzVEEdxNVBeNrRKxkVuj7ufy2TXaeUMs03CO641MiJO/1IsAiWqnuneOUahGWkapz272XeeABn4zbNtuWlPYj+fHzZVQYv8yYjpZOUR079chscNk3N7ceP/uvjXVfZ1f9nptXuR9+/Z2Pdv/I6hn3/DupDf/jmC8pkY77qX7d+r74k34tiof7H1/846I3BT+HdPCfV3s0c8/zjeTmFYIh5s00/r2HyepI0WT/XNxH16X9oyMP1S0NQIJq5kZOdfySWoGevEnSnDDZyoNs4OKPr492h9S+nGr0GzmkPYF7IDoL/Vnd35/D6H2aCvJ4yg5iIYUaINajTjdwxDms/3d+5jcksjNsw7UH0P/x+NmUYd+pXRk786lfbumoUp2X+Z3H/DorehnH/DupDn736rGcARvf/OvUP4tOvS/SpiD7ZVv9+x69Z6J94WiAfX6ZPvy4NfBJXhfDNbcJUnq361cXFg9ao+NGvI4rFjT2ofhm2nuWWcnXKcRA8BcbhbpnkUdUvv8trF6IzgE04Bea3XNJMqKZsWP3z7+T1CMMEeWkfNC3pp/2EqVntdziCOYn+sMog1+aobcVL+7j6vaaThpnKRb9/x+lDh9W/Cf2PvI9lWiCT9Zta/5FpVf6wxbfyaYdI/2J6G/XL0K2XvmGd1CD9YQ24XlOGQfUntrb7pr5mNZD5GQTkU/ygNURSP0cW/EREZ7X+RDVCftv/ae6oT3eYJogjP7zWpP9J2J9+nZthpqE/rHr3Wmgt17GOq381va9lCYSt92/QPtTU/serngetTUX9TzkCJ59S2D2qeZq83Cm/nkh8pNXA2aR/lHmTjcOv/h+++cJZMxPGNCT/LTnlwmt/JtGvvuZl5qbV+fAAprYZNerAkYVa7Ttf7SdM4zOoTfGULpvicdq/7fpNmAWA/vBMs63377A+VK6Vsu3+VQ3cae7ImRWzpf55TNbVfz6e9MZVw35yR8ZAt+ixdktXx2Ob/kHmjfVnsjTyKVPqd9ZBnVSoQDSzrda12ne9jQrU/VvCYGUC6D/NHbnqJLG1TYktoj1y74ScRtn48xsHZx01CpFKd6cT/eziVNuPCZt5Wo2265y+RdJvAtA/e2y+f0f1oakA45fu+3fUzIsN9Z8Zowyz0D/RJgZ1+yz/+/62Ss9eJVyCeWEiETmv/fDNF1o7HZv0y6kubvCRWIK++mTbeRpIicXZ4+qXJm4WN0enXaNILEHRJNFecc1l2nhH2HlucyL9nKOM6GENl9yCvVc8pEx359lUDKr6HQWijrqom5/eTW7/XJYCUee8d/KATfcv9EP/It2/w/pQTo1jW/sZNC5/9cm2E4WLxBJOpEpeG5Pqf+PgjPLxinOCS9j1P9EBzRyKlrmV5EDKOzsHiZ1VXpkw9Yf5BMCh5kF5qibRr65h4RC8XAsyjbUDgxaqsgFTnx7HqX/3k3TceZJWt2DPar2iVz4g09s/9EM/9Nuj308fKscwW+pfLRebHd5QwmPc9fGuqx/nkz9Q/xMYOJkQ8dmrz1xRoEx23UneOWh31Wp6X2vodlr6XRmYKbxUFoyab2uS+lc7LzZv006AyOtPvG5W1jSufvWJWq5xURPIhrFT1Zb2D/3QD/326ffTh8q+z4b691rXHYkl6O71oUu/TBaua/ORyfU/9mH2bH7kAr1CvUmtRpsy2XW6Kdfp8qTiuGZpPNQTD3QwLf2pdJzOc5t0ntukWR66TNSf7T+aXKPE1rbT+CfRLw/jldG9aRzg7WWyZNoArnv5tDWJfvn/vfxVrujkrM2brEdb2j/0Qz/026XfTx9qW/1zvdcuSs6sT6ddo8TWNkWTa86PLKufdX6LVv9jGzgpSE7BsRFgA8AXQqJuO9fBtPTflOu0tBKjpZUY5ePLMzNx3NDV43bUBZGT1D9/t6TVaE89CSLfALIMaiqKcfQPMmTyRtspXoX6tGZL+4d+6Id++/SP6kNtrP9egmtqNdp0f1vty4umnsfrlXtw0et/ok0MslLPc5uOM5UJPkeFJHWGcYPq563zp7mjUG4KXjAsd7xwGZzDmMfQ73ETOWfScQb0aa8b4zIUlGlQ1TwGvUl1tqtp6NcJ9EM/9Jurf1Qfamv9y7N0U2kZPOhuZuDlPcOOMdRV/7wcSVf9jx2Bq12UnOjP5UnFddTJoGzu/O8wj+eYpf7Lk4orVUVYjWfj4GxoFGvS+peROI5ezcII8VSn+mNT+xkG9EM/9EP/rMeBeeo/WX+h3qRCvemMP/JnNb1PGwdnnieC6K5/3e1n7AjcTblOia1u9GeveOgYCjk/zekcdJ2tNmv9hXqTSCyWD3pY9zSewILWv+6ErLa0H+iHfuiHfuifvv5hBgj1P4UInFx4yPBCeq9DWmV0KiyTE4Z+/h4da638PH2ZWv9+n36hH/qhH/qhH/qhfzhjR+B4zRSJHRleuyvYcXLOMelQda5TmoZ+3WVQmUS/6UA/9EM/9EM/9EP/FA2cal68dl/e31ZdOcrCnmqcd/2jsE2/2rihH/qhH/qhH/qhfziPplkAOefLi+JlYjsdSfig31z9vH5A7txRT5uAfuiHfuiHfuiH/hkZOKKHkKHM5i8LZ3r0Cvr1mU9VOzd+6Id+6Id+6Id+6J+BgVMdaKvR7nOfJgP9ZmrnpxToh37oh37oh37on1EEjkUurcT6ji6yIakg9JupHfqhH/qhH/qhH/oH83jSD3rN/6rHMjHR5BplskR0UqECUYdI/y5O6Nenfxzt0A/90A/90A/90D9FAycdKFE3hMjHMXkdLcGFyPTev3Fw1tFtgqBfn/5B2iXQD/3QD/3QD/3Q702gKVQpLrG1TXvFQ7o+3nVe5zNGeXdkNLnm/JgA9Ot/emHtfKasTOvCCz+hH/qhH/qhH/qh300kSEH4bLLE1rbrtdpFyTEPw9AdBoX+8PX70S0PCIZ+6Id+6Id+6If+KRo4tTDqOWYbB2dG5kyDfnN0q8ePnOaOjM21B/3QD/3QD/3Qb5L+yDQKY1p0CvrJipsA9Q790A/90A/90A8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAwU9sx4SfvCRF2aQAAAAAABOVx0C9g45aPL1MqHe/LjcJZiFuNdvfAV0POEoURBQAAAICtBE7km48vUya7PvJ4iD4jZ1jCvrGNaO/cMxg5AAAAAFhj4MYxb15G7vKkYoyJmycjCgAAAID5J9Bh9tLwRGIJ52cY/P5UOm5EBYxrRPkw2qWVGGWy65SPL/uedgUAAAAA0Gbg2PSME3lTWVqJGWN+5sGIAgAAAAAGbiRBjIsp5mfejCgAAAAAYOBGGhdJp11zfib9Dh3MgxEFAAAAwGLxeNErwMuIBv0OnSANCgAAAAADByxh3vLxAQAAAGAGBq7VaFM0GeyPtxptXIEpmbdRO2kffl+lTDZGKWHkYOIAAAAAuxh7DRybBaKHqM64yM/p3gAwDROp04giDQoAAAAAA+eLveKhy4zxzyBTJ19TX5ffpcP4zIMRnac0KC+fv+j4+cGtCwAAYJGZeAo1sbXdt66KqEKZ7Lrn+09zR45hWFqJUavRdn2HDvaKh1S7KE3tuwrpfS0mdBppUHRPpWINX/h1zQStw2l/HwAAgBkYuLfv30VW0/udu/JrajXatLQSo+NXn9Pvix8TEdG3f/kz+tXt3zuD7/1tlf79X/6Mfl8/IyKif/3L39Cv/vj3zvdtHJxp7fDZREojGU2u0f1ttc8Y8e/ke3Ub0aBpUO5vq93v6J3tqstQYA1fuHXNJvnypBKoDuW1I6LA3wcAAMAfE+eBu7+t9qJuRG/iT4mI6Me5Ar2JP3UNwtHkGr2JP6Uf5wqu996U61qjbz0j6pgw/u/lScWJFnpxmjuiy5NK37o3XUbU9nx8WMMXfl1/+nWJVvePKJpcm8oUOl+7aHKN9oqHuCYAAGCqgXv7/l1k4+CMCvUmXZ5U6Mn3Vfrgwzj94bdvBn7mD799Qx98GKcn31edg+x1R99UI3r86nMq1JtUqDfp3//lz1wGkyOJ/Prxq8+NMKLzAI4yC7euJYmt7cDfqRpvXetaAQBgkZh4DRwbrwJRJ3Nbpdsvf9594ft+M/Pk+4fX72+rVKg3jVgn0zOi3UjBSYV+XVyj5IddQ/Am/pSePFEiiT96Sv+m9/qvn/yRTntGtGCAEbWReVrDZ0Ndn+c2KZpcc0Vn72+rdJ7bpJ3i1dj19/L5i8718a7zPbycgIgm/k4AAAAzNnCSy5MKpdLtvoXnEu7gOdplCrYaUTY/3ancaiAT1Gq0tZmgeVjDp16XcdqdLk5zR5RKxymxtd3N51i8CnQNOKp+3esDTDqdBAAAYOCGDFZdY1bvM3KDjNvL5y+Mezq3zYgG3UUrp3517KIlmp+jzGzZRcs6CvUm5YkosdWdth43Yvby+YvOXfm1U6aCMNBYUgAAAAYbOJ6S4SkTt7HpphSRyEFtj4hqFyVjplh48OVBzY8RLRgS8ZnGDljd6Vxsx5ZdtDflOqXS5GrDqYsSJbaIVveP6G5rm1bT+74iiGzeHh7e5ENQ3LhIOwAAwMAJ87a6f+RETboDVHdwUndocoRELlRf3U/QOZF2EycjJ5nsOrUabfqrv30T+ZKo42VEeZDWbULVdC6TTqPykWgbWMc3M/M2zMhRSGk33r5/FykQdXiq+e37d5GXz190bsp1Smw9RD7Pc5ue96yMIKoUxHeqfwMtBAAADDJwsoOXU15ycOKO3ms6stOuUSSW0D71pUYRWXvz7D92bDGhvIs2k405g+w4eezk4KzD+Ni+hk+a+nHQsX5PrRs2XN0oXDcKO2j5AP8umuw+uKhtib8bpg0AAMJhorNQr493XbvZ1HVYvIjZazDg93LU7vp4V2vOqNX9I1fKCplnTJo3/r00odLY6UCmc2EjM24eu5tyXVv0LWi6CXUNny4TOo1dtDrvAZkKx09Z1GUTAAAAwmfiCBx33ksrMWcqVRobdSBgk7S6n6AfvvnC+awuZAoEr4XzPCXsVZZaL2LxYEKJNg7OtE2lvnz+onN5UqFvf/mbsU7E+Ml/+HfaU7rYvoZP3UUrHwZGbcgwaRftpPcj1roBAIAexorAyQPgeUH/JNGHaHKNbsp15+ldVwRCjSKqCWTVqBu/vrp/RPe3VWcqSTdv37+LFOpN+tUf/54++DBOH3wYH3giBr/+qz/+vdaNGOpJGJPWI7chU07C0PUdQdsO34/qsXJeD25yPZwpOR0BAAAGbsyIw/1t1RVpiMQSTifPP2pUQh0gdGfTv7+tuqKINplQNtZE3R2Av/63y/Rff5aiP/3nv+t735/+89/Rf/1Zin79b5fp8qRiRAOUJ2GMY+LUUzLA9K/LqN8h+gYAAPoYewqVp6tuynUq1JuUIV4cP7jj/+GbL/p2s3HKjkw21l1TM2Ei0WkNUryxgk3oD9984Xrvs1efjTahGiJabN549+BDPr448RQwI9OgfPp1iT4lorvXh1p30vJJGBki14aGUZsweMqv2w6vjIkCTZLHTje8mYHvRz9w4l5E3wAAwHADxzs2I7EEtRolV0eeSsddv/PKnyZfl0/urUabnr1KhHr0jpwKdpsDu0yo9y7akpIGxQ0v9jdlJ7BsR9/21uURVfrO7GR4g8a3mtbwySgr76LldjMpchetaqx0XAd+IJH3rNe9CwAAQB++B4iXz190arXviIjoq0+2nYGTzZBX9nnVIDlZ6JXPfvp1d6BIJD6isAzceW6TllZijiZ1GtfLhKoDWaHedDLvr+4fcTQrtIFXXhOvyM+gnYW8CUO+T9caMtUQ8bq8f335O/rVHz02YWQ+dt7L1yysOufTB7i+7sqvqXZRGtruhyHXkiW6SXSJN9a0Gu1QyyWvAd/Lg8wmt32dRhMAABYdXxE4NjxsFFLpOOWJXBEDP5Gc7nvqznfyYMHRoDCjcFIvR9IGmdDuZgZvE8pTT6v73ZQkYUXh1F20tYuSK7Gyl3EzcScwJ8HdOOjujv3gw64pexN/Sn/6ozsa+ib+lP7Nh2y0/4lW94/6prpnjRqd5SUFXlO+ftG5i1ZNZO3VbmTZl1Zi7pMk6k0jj8UDAIB5x/cmBhmxSWxtuyJWg6a7vJDv5cO0vf7GrE0DD1JySsi/CSVPE0rUXYsW1mYG3kUrzds4nzVhE8anX5fo2avP6K78mlLpOP3NP/sn+pt/9k/0P/5Trjf1/vDzP/5Tznl9r3ioJZcga8nHl2l1CmfHyl208vvDmKpUzZu669qrzfDrXSO3TrwUQWceOwAAgIEbAZuU09yRY7a81pKNilrwZxJb286apjAXf7P5jCbXnKkgm0zosGtDZMdOYDWCeH9bdR4Mfvrt7yI35Tp5/ewVD2mveKgljcvb9+8iO70IK7ebSZPZeu2izceXaad4FZp54/tw3JMk5Hv5XtCdjBgAABYN35sYTnNHrmz3bLzkwM9Tcl6Dqpyu4x2b6okBw04QmCYyinZ9vOtEPx4iIt47IFUTWqg3HRPKEaEwUU2AbZswZB6+aHLNOZ7s/25tDzQCD0a06hzOzqcZhHWm6E7xytn5u3Fw5uwAnpSNgzMnClYQJ2vMuiy8hnPSXI7SeBY0JyIGAIBFw1cEjpN98jFYMgKlrhmTxzSxIZI5x9Rjqvi7ahelUHcUshHgKThp4i5PKn0RrAdzRy7jqsuEqob08qRCtYsS1S5Kjk455dVqtKl2UXKO0pLXpNVoO2sQdURR1AjhaPPWv04r7Agi7/6t1b4jjsr5jQbK9+0Ur+j6eJc+/bpE0eSaYwZneR/I6JvXSRJqQutR8Hfoaj8AAAADNzryQKvpfZLnb3oZMz5fc+PgzJkO8tocUKg3aePgjFbT+6HsuJPr3zjyIxefyzLYYEKlPmnmElvbfacw8Nm0rJWvH2fhJ6Kx19FNw7ixmZlkClhqD3vqmv9ep11zHgDYCA8zP5FYgp69+oxajbYTeWs12qFFb3knrWwvkyLXwzG6zzYGAIBFYaxEvqoxefn8RUfNg5VKx11mrEDUUaeY2HDo2LkmIw61i1LPAFT63sMJYoke1uwNMqGFgzMiOgutTNKIyunQ6xHr+Fh7JktEvUSsOncCM5cnFcpkaawpYDWCGHYuQa+o7E7xivK9lDRsatRp61aj1JeChtsiJyYOw7zNYsqTo4k9Q4udqQAAYIqB8+KmXKellaozXeeV/FMdyHQmA1UjDjyQ8cAWTa7R5cmRK5LGJlSaN50mtGvC1l163brca/jUFBfd/684ZrVvE0ZIa+EeNFX6kj2reer4dbXt8Dq+sNO4cAJrmRPNWQsmzBmXiXXL98rPdx8SZmveeNOIXLumMmkkUF0Hp+NBAAAAFolHQT7Ma+NkFMLLnKknL+g6gqd3dJMzgMmdtPw7ngYdVoZB5dTFgwF4MBfq+r1Bu0517ARWT8LgqVA2117Tejw1rE4Bh53GRWpXzRv/fTYzO8Ur56dQbzrX6Ty36Zg31UjN4t6QmmX0cq94ONEOWpVWo+1scJKRUexMBQCA2fF4Wl8kp/LkAMTJbjOGHDj+cP7mmUdEpZt/a9SuOl1r3STqVC4bG06WLHf9dqco1z0NqK5NGKoeqZ+vhTRycp2inPLWEUGU5kv9PSe65bNd+X3q6QZsdAr1pusc22nvppXJkofdu5MmIR7E0kqMUmlyEn4jEgcAAAYaOK+F/15P6byQ3gQTJwc4zoNVuyh5Ds5sQlO9dUomnF5A1F0Q7xU1U9fwERFRb50ZXwtpUMPchDGOfp5S9DR7vTV8utK4ZLLr1Gq06by35lOmZCHqP3Kqe9JH/wkg0ngmtrrXYNqmJ5WOuwxaKt0mmsIaOH5ok2WSa0zZxBFSjAAAgFkGTh6xxR22GkHgAVt28qasj2H9PLhxJGdppdrbmOA2HaaVgQ1LPr5MGwdnzjma8qgv1l+oNynlYaJ1bMIgcueAG6RfNZ9eUTgdEUSuP24v50QP06QHZ54PCwWijmpk+Dxg/j5OZqy2v6DIo7qiyTVKbG3TORGtpvd7+ediE0fhHoyqOx8e/36cBNkAAAD88yjoF/DOTO78vfJxyZMP1BQcuvGbfsKkMvCgyIOyTLA8CC8DyiZC/piknzV5TWdLY6AjjYvcAZzY2nY2wQyqT/X3bN7uyq+d7+IoMOeDm9b6sdpFiS5PKhRNrtFp7shJ28MGPug6OL4+vN7v8qTi3FfTWGMHAABgigZOjV7xoDZoAbr6PlOSfqqnGURiCdo4OOszAV5lCBtZ5zzQE7mjTpe9qUVVvwkGNIh+uTheGoMwcwkO0z/puair6X1aTe9Tq9F2dmhzSpFpwPkb94qHLoMrDeYkG3L4vuHPyu/kpN97xcNQ8jsCAMAiEmgKNUjyVB1HN3kNbn0bGjzMmy7D5sXSSszJX7e0UnWtZ+PTJLz0exvQMyv0y40wbJ7kaybon0SH/Awfz0VEzpqxaZaNDeaguqXexhE/9zSndVGn6hXT2NF9fwMAwDwz8QDBeaVkfrdnrz6jROIjz4S/tdp3fclYNwaYJdMwSb9X1HKUBtv18+fkGqtB5sFU/Ta0cU7JoiYhlsaNiIaaNwAAAIYbuHEHM9sHPug3rwwwD7OpX68Ev5LCDCKEAAAAQjRwAID5NXKDgHEDAAAAAAAAAADG5P8HWcCRO1c3xAIAAAAASUVORK5CYII=';
  // animation rows in the sheet (the figure faces right)
  const ANIM = {
    idle: { row: 0, f: [0] },
    cheer: { row: 0, f: [3, 4, 5, 4] },
    thrust: { row: 1, f: [1, 2, 3, 4, 5, 6] },
    walk: { row: 2, f: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
    throw: { row: 3, f: [1, 2, 3, 4, 5] },
    shoot: { row: 4, f: [2, 3, 4, 8, 9, 10] },
    swing: { row: 4, f: [2, 3, 4, 8, 9, 10, 11] },
  };
  CW.ANIM = ANIM;

  // ---------------------------------------------------------------- colour
  function rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const lift = (c, k) => c.map((v, i) => v + ([255, 246, 228][i] - v) * k);
  const sink = (c, k) => c.map((v, i) => v * (1 - k) + [30, 18, 44][i] * k * 0.4);
  const shade = (h, k) => hex(k >= 0 ? lift(rgb(h), k) : sink(rgb(h), -k));
  // five tones that match the base sheet's skin ramp, plus an outline colour
  const ramps = new Map();
  function ramp(h) {
    let r = ramps.get(h);
    if (!r) {
      const b = rgb(h);
      r = [lift(b, 0.32), b, sink(b, 0.17), sink(b, 0.33), sink(b, 0.52), sink(b, 0.8)];
      ramps.set(h, r);
    }
    return r;
  }

  // ---------------------------------------------------------------- the base frames
  const PAL = { '250,236,231': 0, '249,213,186': 1, '228,164,124': 2, '204,134,101': 3, '153,66,60': 4, '39,25,32': 5, '242,247,248': 6, '42,60,73': 7, '87,206,228': 8, '86,134,174': 9 };
  const frames = {}; // 'row:col' -> analysed frame
  let ready = false;
  CW.bodiesReady = new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve();
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const need = new Set();
      for (const k in ANIM) ANIM[k].f.forEach((f) => need.add(ANIM[k].row + ':' + f));
      need.forEach((key) => {
        const [r, f] = key.split(':').map(Number);
        frames[key] = analyse(g.getImageData(f * FW, r * FH, FW, FH).data);
      });
      ready = true;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = SHEET;
  });

  // split one frame into tones and body regions: 1 head, 2 neck, 3 torso, 4 arm, 5 hand, 6 leg, 7 foot
  function analyse(data) {
    const n = FW * FH;
    const tone = new Int8Array(n).fill(-1);
    for (let i = 0; i < n; i++) {
      if (data[i * 4 + 3] < 128) continue;
      const t = PAL[data[i * 4] + ',' + data[i * 4 + 1] + ',' + data[i * 4 + 2]];
      tone[i] = t === undefined ? 1 : t;
    }
    let ex = 0;
    let ey = 0;
    let en = 0;
    let y0 = 99;
    for (let i = 0; i < n; i++) {
      if (tone[i] < 0) continue;
      y0 = Math.min(y0, (i / FW) | 0);
      if (tone[i] >= 6) {
        ex += i % FW;
        ey += (i / FW) | 0;
        en++;
      }
    }
    const hx = en ? ex / en - 1.9 : 22.5;
    const hy = en ? ey / en - 5.6 : y0 + 9.8;
    const reg = new Uint8Array(n);
    const waist = hy + 25;
    for (let i = 0; i < n; i++) {
      if (tone[i] < 0) continue;
      const x = (i % FW) + 0.5;
      const y = ((i / FW) | 0) + 0.5;
      const dx = x - hx;
      const dy = y - hy;
      if (dx * dx + dy * dy <= 10.4 * 10.4 && dy <= 9.6) reg[i] = 1;
      else if (dy <= 11.2 && Math.abs(dx - 1.5) <= 3.5) reg[i] = 2;
      else if (y <= waist && x >= hx - 4.5 && x <= hx + 8.5 && dy > 9) reg[i] = 3;
      else if (y > waist) reg[i] = 6;
      else reg[i] = 4;
    }
    // arms are the parts outside the torso; their far ends are hands
    const seen = new Uint8Array(n);
    const hands = [];
    const sh = [hx + 2, hy + 11];
    for (let i = 0; i < n; i++) {
      if (reg[i] !== 4 || seen[i] || tone[i] === 5) continue;
      const comp = [];
      const st = [i];
      seen[i] = 1;
      while (st.length) {
        const j = st.pop();
        comp.push(j);
        const x = j % FW;
        for (const d of [-1, 1, -FW, FW]) {
          const k = j + d;
          if (k < 0 || k >= n || (d === -1 && x === 0) || (d === 1 && x === FW - 1)) continue;
          if (!seen[k] && reg[k] === 4 && tone[k] !== 5) {
            seen[k] = 1;
            st.push(k);
          }
        }
      }
      // slivers by the neck are shoulder, not hands
      const top = Math.max(...comp.map((j) => (j / FW) | 0));
      if (comp.length <= 6 && top < hy + 14) {
        comp.forEach((j) => (reg[j] = 3));
        continue;
      }
      let md = 0;
      let far = comp[0];
      for (const j of comp) {
        const d = Math.hypot((j % FW) - sh[0], ((j / FW) | 0) - sh[1]);
        if (d > md) {
          md = d;
          far = j;
        }
      }
      const fx = far % FW;
      const fy = (far / FW) | 0;
      for (const j of comp) if (Math.hypot((j % FW) - fx, ((j / FW) | 0) - fy) <= 2.6 || comp.length <= 7) reg[j] = 5;
      hands.push({ x: fx + 0.5, y: fy + 0.5, n: comp.length });
    }
    let ly = 0;
    for (let i = 0; i < n; i++) if (reg[i] === 6) ly = Math.max(ly, (i / FW) | 0);
    for (let i = 0; i < n; i++) if (reg[i] === 6 && ((i / FW) | 0) >= ly - 3) reg[i] = 7;
    // outline pixels belong to whatever they border most
    const r2 = reg.slice();
    for (let i = 0; i < n; i++) {
      if (tone[i] !== 5) continue;
      const cnt = {};
      for (const d of [-1, 1, -FW, FW, -FW - 1, -FW + 1, FW - 1, FW + 1]) {
        const k = i + d;
        if (k >= 0 && k < n && tone[k] >= 0 && tone[k] !== 5) cnt[reg[k]] = (cnt[reg[k]] || 0) + 1;
      }
      let best = reg[i];
      let bc = 0;
      for (const r in cnt)
        if (cnt[r] > bc) {
          bc = cnt[r];
          best = +r;
        }
      r2[i] = best;
    }
    // the hand that holds the weapon: the one reaching furthest forward, or the near hand at the hip
    let wh = null;
    for (const h of hands) if (h.x > hx + 6 && (!wh || h.x > wh.x)) wh = h;
    return { tone, reg: r2, hx, hy, waist, hands, wh, legBottom: ly };
  }

  // ---------------------------------------------------------------- a small rasteriser for overlays, with a movable frame
  function Buf() {
    this.c = new Float32Array(FW * FH * 3);
    this.l = new Float32Array(FW * FH * 3);
    this.id = new Int16Array(FW * FH);
    this.ol = new Uint8Array(FW * FH);
    this.n = 1;
  }
  const part = (B) => B.n++;
  let T = { x: 0, y: 0, c: 1, s: 0 }; // where local (0,0) lands, and the rotation
  const setT = (x, y, a) => (T = { x, y, c: Math.cos(a || 0), s: Math.sin(a || 0) });
  const toW = (x, y) => [T.x + x * T.c - y * T.s, T.y + x * T.s + y * T.c];
  const toL = (x, y) => {
    const dx = x - T.x;
    const dy = y - T.y;
    return [dx * T.c + dy * T.s, -dx * T.s + dy * T.c];
  };
  const LX = 0.55;
  const LY = 0.83;
  function lit(nx, ny, o) {
    const wx = nx * T.c - ny * T.s;
    const wy = nx * T.s + ny * T.c;
    return -(wx * LX + wy * LY) * (o.gain === undefined ? 1 : o.gain) + (o.bias === undefined ? 0.16 : o.bias);
  }
  const mats = new Map();
  function mat(h) {
    let m = mats.get(h);
    if (!m) {
      const b = rgb(h);
      m = { t: [lift(b, 0.3), b, sink(b, 0.24), sink(b, 0.45)], line: sink(b, 0.74) };
      mats.set(h, m);
    }
    return m;
  }
  function put(B, x, y, m, lv, id, o) {
    if (x < 0 || y < 0 || x >= FW || y >= FH) return;
    const i = y * FW + x;
    const t = o.tone !== undefined ? o.tone : lv > 0.5 ? 0 : lv > -0.12 ? 1 : lv > -0.55 ? 2 : 3;
    const c = m.t[t];
    B.c.set(c, i * 3);
    B.l.set(m.line, i * 3);
    B.id[i] = id;
    B.ol[i] = o.noOL ? 0 : 1;
  }
  // world-space bounding box of a local box
  function wbox(x0, y0, x1, y1) {
    const pts = [toW(x0, y0), toW(x1, y0), toW(x0, y1), toW(x1, y1)];
    return [Math.floor(Math.min(...pts.map((p) => p[0]))), Math.floor(Math.min(...pts.map((p) => p[1]))), Math.ceil(Math.max(...pts.map((p) => p[0]))), Math.ceil(Math.max(...pts.map((p) => p[1])))];
  }
  function ell(B, cx, cy, rx, ry, h, id, o) {
    o = o || {};
    const m = mat(h);
    const [a, b, c, d] = wbox(cx - rx, cy - ry, cx + rx, cy + ry);
    for (let y = Math.max(0, b); y <= Math.min(FH - 1, d); y++)
      for (let x = Math.max(0, a); x <= Math.min(FW - 1, c); x++) {
        const [lx, ly] = toL(x + 0.5, y + 0.5);
        if (o.clip && !o.clip(lx, ly)) continue;
        const nx = (lx - cx) / rx;
        const ny = (ly - cy) / ry;
        if (nx * nx + ny * ny <= 1) put(B, x, y, m, lit(nx, ny, o), id, o);
      }
  }
  function cap(B, x1, y1, x2, y2, r1, r2, h, id, o) {
    o = o || {};
    const m = mat(h);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const L2 = dx * dx + dy * dy || 1;
    const R = Math.max(r1, r2);
    const [a, b, c, d] = wbox(Math.min(x1, x2) - R, Math.min(y1, y2) - R, Math.max(x1, x2) + R, Math.max(y1, y2) + R);
    for (let y = Math.max(0, b); y <= Math.min(FH - 1, d); y++)
      for (let x = Math.max(0, a); x <= Math.min(FW - 1, c); x++) {
        const [px, py] = toL(x + 0.5, y + 0.5);
        let t = ((px - x1) * dx + (py - y1) * dy) / L2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const vx = px - (x1 + dx * t);
        const vy = py - (y1 + dy * t);
        const r = r1 + (r2 - r1) * t;
        const dd = Math.sqrt(vx * vx + vy * vy);
        if (dd <= r) put(B, x, y, m, lit(vx / r, vy / r, o), id, o);
      }
  }
  function inside(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function poly(B, pts, h, id, o) {
    o = o || {};
    const m = mat(h);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const hw = Math.max(1, (x1 - x0) / 2);
    const hh = Math.max(1, (y1 - y0) / 2);
    const [a, b, c, d] = wbox(x0, y0, x1, y1);
    for (let y = Math.max(0, b); y <= Math.min(FH - 1, d); y++)
      for (let x = Math.max(0, a); x <= Math.min(FW - 1, c); x++) {
        const [lx, ly] = toL(x + 0.5, y + 0.5);
        if (o.clip && !o.clip(lx, ly)) continue;
        if (inside(pts, lx, ly)) put(B, x, y, m, lit(((lx - cx) / hw) * 0.85, ((ly - cy) / hh) * 0.85, o), id, o);
      }
  }
  function dot(B, x, y, h) {
    const [wx, wy] = toW(x, y);
    const X = Math.round(wx - 0.5);
    const Y = Math.round(wy - 0.5);
    if (X < 0 || Y < 0 || X >= FW || Y >= FH) return;
    const i = Y * FW + X;
    const c = typeof h === 'string' ? rgb(h) : h;
    B.c.set(c, i * 3);
    if (!B.id[i]) {
      B.id[i] = 9999;
      B.l.set([c[0] * 0.3, c[1] * 0.3, c[2] * 0.3], i * 3);
    }
    B.ol[i] = 0;
  }
  const dots = (B, pts, h) => pts.forEach(([x, y]) => dot(B, x, y, h));
  // flatten a layer onto RGBA pixels: parts get dark edges against what's behind them, the layer gets an outline
  function flatten(B, out, outline, soft) {
    const nb = [-1, 1, -FW, FW];
    const n = FW * FH;
    for (let i = 0; i < n; i++) {
      const id = B.id[i];
      if (!id) continue;
      let r = B.c[i * 3];
      let g = B.c[i * 3 + 1];
      let b = B.c[i * 3 + 2];
      if (B.ol[i]) {
        const x = i % FW;
        for (const d of nb) {
          const j = i + d;
          if (j < 0 || j >= n || (d === -1 && x === 0) || (d === 1 && x === FW - 1)) continue;
          const nid = B.id[j];
          if (nid > 0 && nid < id) {
            r = r * 0.3 + B.l[i * 3] * 0.7;
            g = g * 0.3 + B.l[i * 3 + 1] * 0.7;
            b = b * 0.3 + B.l[i * 3 + 2] * 0.7;
            break;
          }
        }
      }
      out[i * 4] = r;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = b;
      out[i * 4 + 3] = 255;
    }
    if (!outline) return;
    const edges = [];
    for (let i = 0; i < n; i++) {
      if (B.id[i]) continue;
      const x = i % FW;
      let best = -1;
      let bl = 1e9;
      for (const d of nb) {
        const j = i + d;
        if (j < 0 || j >= n || (d === -1 && x === 0) || (d === 1 && x === FW - 1) || !B.id[j] || !B.ol[j] || B.id[j] === 9999) continue;
        const s = B.l[j * 3] + B.l[j * 3 + 1] + B.l[j * 3 + 2];
        if (s < bl) {
          bl = s;
          best = j;
        }
      }
      if (best >= 0) edges.push([i, best]);
    }
    for (const [i, best] of edges) {
      const lr = B.l[best * 3] * 0.55 + 10;
      const lg = B.l[best * 3 + 1] * 0.55 + 6;
      const lb = B.l[best * 3 + 2] * 0.55 + 14;
      if (out[i * 4 + 3]) {
        if (!soft) continue;
        out[i * 4] = out[i * 4] * 0.5 + lr * 0.5;
        out[i * 4 + 1] = out[i * 4 + 1] * 0.5 + lg * 0.5;
        out[i * 4 + 2] = out[i * 4 + 2] * 0.5 + lb * 0.5;
      } else {
        out[i * 4] = lr;
        out[i * 4 + 1] = lg;
        out[i * 4 + 2] = lb;
        out[i * 4 + 3] = 255;
      }
    }
  }

  // ---------------------------------------------------------------- hair, hats and faces (local to the head centre)
  // The base head is a circle of radius ~10 facing right: the eyes sit low (y +4.5..+6.5, x +0.5..+3.5),
  // the chin is at +9, the face side is the right.
  function hair(B, L, hs, col, hat) {
    if (['bald', 'none'].includes(hs)) return;
    const h = part(B);
    if (hs === 'balding') {
      ell(B, -8, 2, 2.6, 4, col, h);
      return;
    }
    if (hs === 'buzz') {
      ell(B, -0.5, -2, 10.4, 8.6, col, h, { clip: (x, y) => y < 0.5 || (x < -3 && y < 5), bias: 0.2, gain: 0.5 });
      return;
    }
    if (hs === 'top') {
      ell(B, 0, -5, 9.4, 5.6, col, h, { bias: 0.15 });
      poly(B, [[-5, -3], [9.5, -4], [10, 0.5], [3, -0.5], [-4, 0]], col, h, { gain: 0.6 });
      return;
    }
    const front = ['slick', 'neat', 'side'].includes(hs) ? 0.5 : 1;
    ell(B, -0.5, -1.6, 10.7, 9.2, col, h, { clip: (x, y) => y < front || (x < -2 && y < 7.5) || (x < 1 && y < 3), bias: 0.1 });
    const spikes = (list) => list.forEach(([x, y, tx, ty]) => poly(B, [[x, y], [x + 4.4, y - 0.4], [tx, ty]], col, h, { gain: 0.7 }));
    if (['short', 'wild', 'curly', 'wavy', 'long', 'longwavy', 'bob', 'bun', 'updo', 'bouffant'].includes(hs))
      spikes([[-2.5, -1, 0.3, 3.7], [1, -1, 4, 3.9], [4.5, -1.2, 7.6, 3.4], [7.2, -1.8, 10.2, 2]]);
    if (!hat && (hs === 'short' || hs === 'wild')) spikes([[-11, -2, -14.5, 0.5], [-9, -7, -13, -9], [-4, -9.5, -6, -13.6]]);
    if (!hat && hs === 'wild') spikes([[1, -10, 2.5, -14], [6, -8.5, 10, -11], [-11, 3, -14, 6.5]]);
    if (['curly', 'wavy', 'bouffant'].includes(hs)) for (const [x, y] of [[-8, -6], [-3, -9], [3, -9.4], [8, -6.5], [-10.5, 0], [10, -2]]) ell(B, x, y, 3.4, 3, col, h);
    if (['side', 'neat', 'slick'].includes(hs)) {
      poly(B, [[-9, -4], [10.5, -4.5], [11, 0.5], [5, -0.6], [-2, 0], [-8, 1.5]], col, h, { gain: 0.6 });
    }
    if (hs === 'swoop') poly(B, [[-11, -2], [-4, -10], [6, -10.5], [12.5, -5.5], [13, 0], [7, -1.6], [0, -0.5], [-6, 1], [-10, 3]], col, h, { gain: 0.7 });
    if (hs === 'powdered') {
      ell(B, -9.5, 3.5, 3, 2.3, col, h);
      ell(B, -9.5, 7.5, 3, 2.3, col, h);
    }
    if (hs === 'bun' || hs === 'updo') ell(B, -7, -9, 4, 3.6, col, h);
    if (hs === 'bob') poly(B, [[7, -3], [11.5, -1], [11, 9.5], [8, 8.5]], col, h, { gain: 0.7 });
    if (hs === 'long' || hs === 'longwavy') poly(B, [[6.5, -2], [10.5, 0], [10.6, 12], [7.5, 13]], col, h, { gain: 0.7 });
    // shine across the top, broken into clumps
    const shine = shade(col, ['#1d1714', '#3b2618', '#2a1a12'].includes(col) ? 0.45 : 0.36);
    for (let x = -8; x <= 7; x++) {
      if ((x + 8) % 5 === 4) continue;
      const y = -6.4 + (x * x) / 36;
      dot(B, x + 0.5, y, shine);
      dot(B, x + 0.5, y + 1, shine);
    }
  }
  // the long back mass of hair, drawn behind the body
  function hairBack(B, hs, col) {
    if (!['long', 'longwavy', 'bob', 'powdered', 'wild', 'bouffant'].includes(hs)) return;
    const to = hs === 'bob' ? 9 : hs === 'powdered' ? 12 : hs === 'wild' ? 14 : 22;
    const h = part(B);
    poly(B, [[-10, -3], [-1, -7], [0, 6], [-2, to], [-8, to + 1], [-11.5, to - 3], [-12, 4]], col, h, { gain: 0.9 });
    if (hs === 'longwavy' || hs === 'wild') {
      ell(B, -11, to - 5, 3, 4, col, h);
      ell(B, -8.5, to - 1, 3, 3, col, h);
    }
    if (hs === 'powdered') cap(B, -10, 7, -12.5, 14, 1.1, 0.9, '#1a1a1a', part(B));
  }
  function beard(B, fh, fc, skin) {
    const f = part(B);
    switch (fh) {
      case 'mustache':
        poly(B, [[1.5, 7.2], [6.8, 7], [6.8, 8.1], [1.6, 8.3]], fc, f, { gain: 0.5 });
        break;
      case 'toothbrush':
        poly(B, [[3, 7.1], [5.4, 7.1], [5.4, 8.4], [3, 8.4]], fc, f, { tone: 2 });
        break;
      case 'walrus':
        poly(B, [[0.5, 7], [7.5, 6.8], [7.8, 9.4], [5.5, 10.2], [2, 10.2], [0.5, 9.3]], fc, f, { gain: 0.5 });
        break;
      case 'kaiser':
        poly(B, [[-0.5, 5.6], [1.5, 7.3], [6.8, 7], [9.5, 4.5], [9, 7.5], [6, 8.6], [1.5, 8.6]], fc, f, { gain: 0.5 });
        break;
      case 'longmustache':
        poly(B, [[1.4, 7.2], [6.8, 7], [6.8, 8.2], [1.6, 8.4]], fc, f, { gain: 0.5 });
        cap(B, 1.6, 8, 0.8, 13, 0.7, 0.5, fc, f);
        cap(B, 6.6, 8, 7.2, 13, 0.7, 0.5, fc, f);
        break;
      case 'goatee':
        poly(B, [[2, 9.2], [6, 9.2], [5.2, 13], [3.2, 13.4]], fc, f, { gain: 0.5 });
        poly(B, [[2, 7.2], [6.4, 7], [6.4, 8], [2, 8.2]], fc, f, { tone: 2 });
        break;
      case 'beard':
      case 'fullbeard':
      case 'longbeard':
      case 'santa': {
        const end = fh === 'beard' ? 12.5 : fh === 'fullbeard' ? 14.5 : 19;
        poly(B, [[-7.5, 2.5], [-5.5, 2.5], [-3, 7], [2, 8.6], [6, 8.4], [8.5, 5.5], [9, 9], [6, end - 1], [2, end], [-3, end - 1.5], [-7, 9]], fc, f, { gain: 0.75 });
        poly(B, [[1, 6.8], [8, 6.4], [8.2, 8], [1.2, 8.3]], fc, f, { tone: 0 });
        dots(B, [[3.5, 9], [4.5, 9]], '#3a1418');
        break;
      }
      case 'chinstrap':
        poly(B, [[-7.5, 2.5], [-5.5, 2.5], [-2.5, 8.5], [2, 10.2], [6, 9.5], [8.6, 6.5], [8.4, 10], [5, 13], [0.5, 13.4], [-4, 11.5], [-7.5, 7]], fc, f, { gain: 0.7 });
        break;
      case 'sideburns':
        poly(B, [[-7, 0], [-5, 0], [-4.5, 7], [-6.5, 7]], fc, f, { gain: 0.5 });
        break;
      case 'scruff':
      case 'stubble':
        for (let y = 6; y < 11; y++) for (let x = -6; x < 9; x++) if ((x * 3 + y * 5) % 4 === 0 && x * x + (y - 2) * (y - 2) < 70) dot(B, x + 0.5, y + 0.5, shade(skin, -0.3));
        break;
      case 'pharaoh':
        poly(B, [[3, 9.5], [5.4, 9.5], [5.2, 15], [3.2, 15]], fc === '#e9e6df' ? '#2a1e14' : fc, f, { gain: 0.5 });
        for (let y = 11; y < 15; y += 2) dot(B, 4.2, y, '#d9b45a');
        break;
    }
  }
  function headwear(B, hat, hc, ha, plume) {
    const H = part(B);
    const acc = ha === hc ? '#d9b45a' : ha;
    switch (hat) {
      case 'crown':
        poly(B, [[-9, -6], [9, -6.5], [9.2, -12], [6.5, -9.5], [4.5, -14], [2, -10], [-0.5, -14.5], [-3, -10], [-5.5, -14], [-7.5, -9.5], [-9.2, -12]], hc, H, { gain: 0.6, bias: 0.3 });
        dots(B, [[-0.5, -9], [-5, -8.5], [4.5, -8.6]], ha === hc ? '#c8102e' : ha);
        break;
      case 'circlet':
      case 'tiara':
        cap(B, -9.5, -4, 9.5, -4.6, 0.8, 0.8, hc, H, { bias: 0.4 });
        if (hat === 'tiara') poly(B, [[1.5, -5], [3.5, -8.5], [5.5, -5]], hc, H, { bias: 0.4 });
        dot(B, 3.5, -4.6, ha === hc ? '#9ad8ff' : ha);
        break;
      case 'laurel':
        for (let i = 0; i < 7; i++) ell(B, -9 + i * 3, -5 - Math.sin((i / 6) * Math.PI) * 2.6, 1.8, 1.1, hc, H, { bias: 0.3 });
        break;
      case 'greek':
        ell(B, -0.5, -1.5, 11.4, 10.2, hc, H, { clip: (x, y) => !(x > -1 && y > -1 && y < 9.5), bias: 0.25 });
        poly(B, [[-6, -12], [5, -14], [12, -8], [5, -10], [-3, -10]], ha, part(B), { gain: 0.6 });
        break;
      case 'nasal':
      case 'spike':
        poly(B, [[-11, 0], [-9, -7], [-0.5, -14], [9, -7], [11, 0]], hc, H, { gain: 0.8, bias: 0.25 });
        if (hat === 'nasal') cap(B, 5.5, -1, 5.8, 6, 0.8, 0.8, hc, H);
        break;
      case 'nemes':
        poly(B, [[-11, 4], [-9, -7], [0, -10.5], [9, -7], [11, 0], [7, -1], [-4, -1], [-6, 9]], hc, H, { gain: 0.6 });
        for (let y = -9; y < 9; y += 2) for (let x = -11; x <= 11; x++) dot(B, x + 0.5, y + 0.5, ha);
        break;
      case 'uraeus':
        cap(B, -9.5, -4, 9.5, -4.6, 0.8, 0.8, '#d9b45a', H, { bias: 0.4 });
        cap(B, 4, -5, 4.6, -8.6, 0.8, 0.6, '#d9b45a', H, { bias: 0.4 });
        break;
      case 'bicorne':
        poly(B, [[-15, -5], [-8, -11], [1, -13.5], [10, -11], [16, -5], [9, -4], [-7, -3.6]], hc, H, { gain: 0.6 });
        ell(B, 5, -9, 1.6, 1.6, ha === hc ? '#c8102e' : ha, part(B));
        break;
      case 'tricorne':
        poly(B, [[-13, -4], [-8, -11], [0, -9], [8, -11.5], [13, -4], [5, -5], [0, -3], [-6, -5]], hc, H, { gain: 0.6 });
        break;
      case 'tophat':
        poly(B, [[-7.5, -6], [7.5, -6.5], [7, -18], [-7, -18]], hc, H, { gain: 0.7 });
        cap(B, -12, -5.5, 12.5, -6, 1.2, 1.2, hc, H);
        for (let x = -7; x < 7; x++) dot(B, x + 0.5, -8, ha === hc ? '#5a5a5a' : ha);
        break;
      case 'peaked':
      case 'patrol':
      case 'kepi': {
        const tall = hat === 'kepi' ? -1.5 : hat === 'patrol' ? 1.5 : 0;
        poly(B, [[-10.5, -4], [-9.5, -10 + tall], [0, -12.5 + tall], [10, -11 + tall], [11, -4]], hc, H, { gain: 0.7 });
        if (hat === 'peaked') poly(B, [[-12, -9.5], [0, -14.5], [12.5, -11], [11, -8], [0, -10.5], [-10.5, -7.5]], hc, H, { gain: 0.6, bias: 0.3 });
        poly(B, [[2, -4.5], [14, -5], [14.5, -3], [2.5, -2.8]], '#141418', part(B), { gain: 0.5 });
        dots(B, [[2.5, -9], [3.5, -9]], acc);
        break;
      }
      case 'beret':
        ell(B, 1, -7.5, 11.4, 4.4, hc, H, { bias: 0.2 });
        dot(B, 4.5, -8, ha === hc ? '#e8c84a' : ha);
        break;
      case 'helmet':
        ell(B, -0.5, -4.5, 11.8, 7.5, hc, H, { clip: (x, y) => y < -1, bias: 0.25 });
        cap(B, -13, -1.5, 13, -2, 1, 1, hc, H);
        break;
      case 'pickel':
        ell(B, -0.5, -4.5, 11, 7, hc, H, { clip: (x, y) => y < -1, bias: 0.25 });
        poly(B, [[-1.5, -10.5], [1.5, -10.5], [0, -16.5]], acc, part(B), { bias: 0.4 });
        poly(B, [[1.5, -3.5], [13, -3.5], [13, -1.6], [2.5, -1.4]], '#141418', part(B));
        break;
      case 'campaign':
        poly(B, [[-16, -3.5], [-9, -6.5], [-6, -12.5], [1, -14.5], [7, -12.5], [10, -6.5], [17, -3.5], [9, -2], [-8, -2]], hc, H, { gain: 0.6 });
        break;
      case 'flatcap':
        poly(B, [[-10, -3.5], [-9, -9], [2, -11], [11, -8.5], [14, -4], [5, -3]], hc, H, { gain: 0.6 });
        break;
      case 'fur':
        ell(B, -0.5, -6.5, 11.4, 6.4, hc, H, { bias: 0.25 });
        if (ha !== hc) cap(B, -10.5, -2.5, 10.5, -2.5, 1.4, 1.4, ha, part(B));
        break;
      case 'mongol':
        poly(B, [[-11, -2.5], [-6, -10.5], [0, -15.5], [7, -10.5], [11, -2.5]], hc, H, { gain: 0.7 });
        cap(B, -11.5, -2.5, 11.5, -2.5, 1.8, 1.8, ha === hc ? '#7a5a3a' : ha, part(B), { bias: 0.3 });
        break;
      case 'turban':
      case 'bigturban': {
        const big = hat === 'bigturban';
        ell(B, 0, big ? -8.5 : -7, big ? 12.6 : 11.2, big ? 7.8 : 6.4, hc, H, { bias: 0.3 });
        ell(B, 4, big ? -8 : -6.5, 1.5, 1.8, ha === hc ? '#c8102e' : ha, part(B), { bias: 0.4 });
        break;
      }
      case 'tallcap':
        poly(B, [[-9, -4], [9, -4], [8.5, -17], [-8.5, -17]], hc, H, { gain: 0.6 });
        for (let x = -8; x < 8; x++) {
          dot(B, x + 0.5, -8, ha);
          dot(B, x + 0.5, -13, ha);
        }
        break;
      case 'mian':
        cap(B, -8, -5, 9, -5, 2, 2, hc, H);
        poly(B, [[-13, -10], [14, -12], [14, -10], [-13, -8]], hc, H, { gain: 0.5 });
        for (const x of [-12, -10, 12, 14]) for (let y = -8; y < 1; y += 2) dot(B, x, y, acc);
        break;
      case 'kabuto':
        ell(B, -0.5, -3, 12, 9.2, hc, H, { clip: (x, y) => y < -1 || x < -4, bias: 0.25 });
        poly(B, [[-14, -1], [-4, -2], [-4, 5], [-15, 4]], hc, H, { gain: 0.6 });
        poly(B, [[-1, -10], [-5, -18], [1, -13], [5, -13], [11, -18], [7, -10]], ha, part(B), { bias: 0.3 });
        break;
      case 'princecap':
        ell(B, 2, -8, 7, 3.5, hc, H, { bias: 0.3 });
        break;
      case 'band':
        cap(B, -10.5, -1.5, 10.5, -2, 1.1, 1.1, hc, H, { bias: 0.3 });
        cap(B, -10.5, -1.5, -16, 4, 0.9, 0.6, hc, H);
        cap(B, -10.5, -1, -15, 7, 0.9, 0.6, hc, H);
        break;
      case 'plume':
        poly(B, [[-13, -3.5], [-8, -9.5], [1, -11.5], [10, -9.5], [15, -3.5], [1, -2.5]], hc, H, { gain: 0.6 });
        cap(B, -5, -9.5, -15, -15, 1.6, 0.8, plume || acc, part(B), { bias: 0.3 });
        break;
      case 'scarf':
        ell(B, -0.5, -1.5, 11.4, 10, hc, H, { clip: (x, y) => !(x > -2 && y > -1), bias: 0.15 });
        poly(B, [[-11, 4], [-4, 8], [-8, 18], [-13, 16]], hc, H, { gain: 0.6 });
        break;
      case 'monomakh':
        ell(B, -0.5, -7, 10.4, 5, hc, H, { bias: 0.4 });
        cap(B, -10.5, -2.5, 10.5, -2.5, 1.8, 1.8, ha === hc ? '#4a3a2a' : ha, part(B), { bias: 0.2 });
        cap(B, -0.5, -12, -0.5, -16.5, 0.6, 0.6, '#d9b45a', part(B));
        cap(B, -2, -15, 1, -15, 0.5, 0.5, '#d9b45a', part(B));
        break;
      case 'leopard':
        poly(B, [[-9, -3], [-9, -11], [9, -11], [9, -3]], hc, H, { gain: 0.6 });
        for (let i = 0; i < 10; i++) dot(B, -8 + ((i * 7) % 16), -10 + ((i * 3) % 7), '#2a1a10');
        break;
      case 'santa':
        poly(B, [[-10, -4], [-2, -13], [6, -14], [12, -10], [16, -2], [13, -1], [10, -6]], '#c8102e', H, { gain: 0.7 });
        cap(B, -11, -3.5, 11, -3.5, 1.8, 1.8, '#f4f0ea', part(B), { bias: 0.3 });
        ell(B, 15.5, -1, 2.2, 2.2, '#f4f0ea', part(B), { bias: 0.3 });
        break;
      case 'horns':
        poly(B, [[-7, -7], [-4, -8], [-9, -16], [-12, -13]], hc, H, { bias: 0.3 });
        poly(B, [[4, -8], [7, -7], [12, -14], [10, -17]], hc, H, { bias: 0.3 });
        break;
      case 'spacehelm':
        ell(B, 0, 0.5, 13, 12.5, hc, H, { clip: (x, y) => !(x > -4 && y > -3 && y < 10), bias: 0.2 });
        break;
      case 'shards':
        for (let i = 0; i < 5; i++) poly(B, [[-9 + i * 4.4, -5], [-7 + i * 4.4, -5], [-8 + i * 4.4 + (i - 2) * 0.6, i % 2 ? -13 : -17]], hc, H, { bias: 0.35 });
        break;
    }
  }

  // ---------------------------------------------------------------- weapons (local to the hand, pointing along +x)
  const GRIP = { sword: 1, katana: 1, scimitar: 1, blade: 1, axe: 1, club: 1, spear: 2, javelin: 2, trident: 2, staff: 2, sceptre: 2, scythe: 2, flag: 3, candy: 3 };
  const GUNS = new Set(['gun', 'rifle', 'musket', 'mg', 'smg', 'longrifle', 'laser', 'raygun', 'plasma']);
  function weapon(B, w, opt) {
    const wp = part(B);
    const steel = '#c8ccd8';
    const wood = '#7a4a24';
    const gold = '#d9b45a';
    const blade = (len, wdt, c) => {
      cap(B, 2, 0, len, 0, wdt, 0.45, c, wp, { bias: 0.25 });
      for (let i = 3; i < len - 1; i++) dot(B, i, -0.5, shade(c, 0.45));
    };
    switch (w) {
      case 'sword':
        blade(15, 1.4, steel);
        cap(B, 1.5, -3, 1.5, 3, 0.8, 0.8, gold, wp, { bias: 0.3 });
        cap(B, -2.5, 0, 0, 0, 0.9, 0.9, '#5a3a1a', wp);
        break;
      case 'katana':
        blade(16, 1.1, '#dfe4ea');
        cap(B, 1.5, -1.5, 1.5, 1.5, 0.8, 0.8, '#1a1a1a', wp);
        cap(B, -3.5, 0, 0.5, 0, 0.8, 0.8, '#2a2a3a', wp);
        break;
      case 'scimitar':
        cap(B, 2, 0, 9, 1, 1.5, 1.8, steel, wp, { bias: 0.25 });
        cap(B, 9, 1, 15, -1.5, 1.8, 0.4, steel, wp, { bias: 0.25 });
        cap(B, 1.5, -2.5, 1.5, 2.5, 0.8, 0.8, gold, wp, { bias: 0.3 });
        break;
      case 'blade':
        blade(15, 1.3, opt.glow || '#d08aff');
        cap(B, 1.5, -2, 1.5, 2, 0.8, 0.8, '#2a2a3a', wp);
        break;
      case 'axe':
        cap(B, -3, 0, 13, 0, 0.9, 0.9, wood, wp);
        poly(B, [[9, -1], [14, -6], [16.5, -1], [14, 4.5], [9.5, 1.5]], steel, wp, { bias: 0.25 });
        break;
      case 'club':
        cap(B, -2, 0, 12, 0, 1.1, 3, opt.club || '#8a5a2a', wp, { bias: 0.2 });
        break;
      case 'spear':
      case 'javelin':
        cap(B, -9, 0, 15, 0, 0.7, 0.7, wood, wp);
        poly(B, [[14, -1.6], [19, 0], [14, 1.6]], steel, wp, { bias: 0.3 });
        break;
      case 'trident':
        cap(B, -9, 0, 15, 0, 0.7, 0.7, opt.pole || '#2a2a2a', wp);
        cap(B, 15, -3.2, 15, 3.2, 0.6, 0.6, opt.tip || '#c8102e', wp);
        for (const dy of [-3, 0, 3]) cap(B, 15, dy, 19.5, dy, 0.6, 0.35, opt.tip || '#c8102e', wp);
        break;
      case 'staff':
      case 'sceptre':
        cap(B, -9, 0, 15, 0, 0.7, 0.7, w === 'sceptre' ? gold : opt.walk ? '#a8844a' : '#5a3a2a', wp);
        if (!opt.walk) ell(B, 17, 0, 2.4, 2.4, opt.orb || '#7dffd0', part(B), { bias: 0.4 });
        break;
      case 'scythe':
        cap(B, -9, 0, 16, 0, 0.7, 0.7, '#3a3a40', wp);
        cap(B, 16, 0, 15, 8, 1.4, 0.4, '#c8ccd8', wp, { bias: 0.3 });
        break;
      case 'flag': {
        cap(B, -10, 0, 18, 0, 0.7, 0.7, wood, wp);
        const fc = opt.flag || '#c8102e';
        poly(B, [[18, 1], [17, 12], [13.5, 10.5], [12, 12.5], [9, 1]], fc, part(B), { gain: 0.6 });
        break;
      }
      case 'candy':
        cap(B, -10, 0, 14, 0, 1.1, 1.1, '#f4f0ea', wp, { bias: 0.3 });
        cap(B, 14, 0, 17, 3, 1.1, 1.1, '#f4f0ea', wp, { bias: 0.3 });
        for (let x = -9; x < 14; x += 3) dot(B, x, 0, '#c8102e');
        break;
      case 'gun':
      case 'raygun':
        poly(B, [[-1, -2.5], [7, -2.5], [7, -0.6], [2, -0.6], [1.2, 2.5], [-1.2, 2.5]], w === 'raygun' ? '#6a7a8a' : '#2a2a30', wp, { gain: 0.6, bias: 0.3 });
        if (w === 'raygun') ell(B, 8.5, -1.5, 1.4, 1.4, '#7dffb0', part(B), { bias: 0.5 });
        break;
      case 'rifle':
      case 'musket':
      case 'longrifle':
      case 'mg':
      case 'smg':
      case 'laser':
      case 'plasma': {
        const len = w === 'smg' ? 9 : w === 'mg' ? 13 : w === 'longrifle' ? 18 : w === 'musket' ? 17 : 14;
        const body = w === 'laser' || w === 'plasma' ? '#4a5060' : w === 'mg' || w === 'smg' ? '#2a2a30' : '#5a3a1e';
        poly(B, [[-7, 1], [-3, -1.6], [len, -1.4], [len, 0.2], [0, 1], [-4, 3.4]], body, wp, { gain: 0.6, bias: 0.25 });
        cap(B, 0, -1, len + 1, -1, 0.5, 0.5, w === 'laser' || w === 'plasma' ? '#7a8aa8' : '#4a4a52', wp);
        if (w === 'laser' || w === 'plasma') dot(B, len + 1.5, -1, w === 'laser' ? '#2ee6ff' : '#d08aff');
        if (w === 'mg') cap(B, 3, 1.5, 4, 4, 0.8, 0.8, '#3a3a40', wp);
        break;
      }
      case 'bow':
        cap(B, 0, -11, 3, -4, 0.8, 0.8, wood, wp);
        cap(B, 3, -4, 3, 4, 0.8, 0.8, wood, wp);
        cap(B, 3, 4, 0, 11, 0.8, 0.8, wood, wp);
        for (let y = -10; y < 11; y++) dot(B, -0.5, y, '#e8e4dc');
        break;
      case 'rock':
        ell(B, 1, -1, 1.8, 1.6, '#8a7a6a', wp, { bias: 0.3 });
        break;
      case 'grenade':
        ell(B, 1, -1, 1.5, 1.8, '#3a4a2a', wp, { bias: 0.3 });
        break;
      case 'sling':
        cap(B, 0, 0, 2, 6, 0.4, 0.4, '#6a4a2a', wp);
        ell(B, 2, 6.5, 1.3, 1.3, '#8a7a6a', wp);
        break;
      case 'mic':
        cap(B, 0, 0, 5, 0, 0.7, 0.7, '#2a2a2a', wp);
        ell(B, 6.5, 0, 1.8, 1.8, '#9aa0a8', part(B), { bias: 0.3 });
        break;
      case 'book':
        poly(B, [[-1, -3.5], [5, -4], [5.5, 3.5], [-0.5, 4]], opt.book || '#c8102e', wp, { gain: 0.5, bias: 0.25 });
        break;
      case 'handbag':
        cap(B, 0, 0, 0, 3, 0.4, 0.4, '#1a1a1a', wp);
        poly(B, [[-3.5, 3], [4, 2.5], [4.5, 9], [-4, 9.5]], '#1c1c22', part(B), { gain: 0.6, bias: 0.3 });
        break;
    }
  }

  // ---------------------------------------------------------------- looks: how a leader or a soldier is dressed
  const SIG = {
    sun_tzu: { scroll: 1 }, leonidas: { cape: '#a8241c', shield: { c: '#c9973a', e: '#a8241c', mark: 'lambda' } },
    spartacus: { shield: { c: '#8a5a2a', e: '#c9973a', small: 1 } }, alexander: { cape: '#6a2a7a' }, caesar: { cape: '#a8241c' },
    cleopatra: { kohl: 1 }, hannibal: { cape: '#3a2a6a' }, qin: { cape: '#1a1a1a' }, boudica: { cape: '#2a5a2a' },
    charlemagne: { cape: '#a8241c' }, ragnar: { shield: { c: '#7a5a34', e: '#c8a040' } }, harald: { shield: { c: '#2a4a8a', e: '#d9b45a' } },
    william: { shield: { c: '#c8a040', e: '#a8241c', kite: 1 } }, richard: { shield: { c: '#a8241c', e: '#d9b45a', kite: 1 }, cape: '#e8e4dc' },
    joan: { flag: '#e8e4dc' }, genghis: { cape: '#5a3a1a' }, vlad: { cape: '#5a0a12' }, peter: { cape: '#1a3a2a' },
    catherine: { cape: '#f0ece4' }, washington: { cape: '#1a2a5a' }, robespierre: { sash: '#2a4a9a' }, napoleon: { sash: '#e8e4dc' },
    bolivar: { sash: '#e8c84a' }, shaka: { shield: { c: '#f0ece4', e: '#1a1a1a', oval: 1 } }, bismarck: { cape: '#1a1a1a' },
    wilhelm: { cape: '#1a1a1a' }, gandhi: { glasses: 1, walk: 1 }, churchill: { cigar: 1 }, stalin: { pipe: 1 }, fdr: { cape: '#1a2a4a' },
    mao: { book: '#c8102e' }, castro: { cigar: 1 }, mlk: { tie: '#2a2a2a' }, pinochet: { cape: '#4a4a52' }, gaddafi: { sash: '#2a8a3a' },
    amin: { sash: '#c8102e' }, elizabeth2: { flag: '#e8e4dc' }, trump: { tie: '#c8102e' }, obama: { tie: '#2a4a8a' }, jfk: { tie: '#2a2a3a' },
    putin: { tie: '#5a1a1a' }, santa: { sack: '#8a5a2a' }, devil: { tail: '#a8141c', cape: '#2a0808', pole: '#2a2a2a', tip: '#c8102e' },
    exterminator: { shades: 1 }, saladin: { cape: '#e8e4dc' }, suleiman: { cape: '#2a6a3a' }, timur: { cape: '#3a2a5a' },
    mehmed: { cape: '#a8241c' }, frederick: { cape: '#2a3a6a' }, nelson: { sash: '#1a2a5a' }, archon: { cape: '#ffe86a' },
    cosmickhan: { cape: '#2ee6ff' }, empress: { cape: '#9ad8ff' }, admiral: { cape: '#1a1a2a' }, mobutu: { walk: 1 },
    troosevelt: { club: '#6a4a2a' }, hive: { pole: '#5a6a3a', tip: '#9adc5a' },
  };
  CW.SIG = SIG;
  // cloth colours for each outfit
  function outfitLook(o, oc, ac, skin, era) {
    const d = { torso: oc, sleeve: oc, pants: shade(oc, -0.25), boots: '#2a2220', bootH: 2, hands: skin, bareArms: false, bareLegs: false, skirt: null, belt: null, collar: null };
    const set = (x) => Object.assign(d, x);
    switch (o) {
      case 'suit': set({ pants: shade(oc, -0.08), boots: '#16161a', collar: '#f2efe8' }); break;
      case 'jacket': set({ pants: '#2c3448', collar: ac }); break;
      case 'uniform': set({ pants: shade(oc, -0.18), boots: '#18141a', bootH: 6, belt: '#2a1e14' }); break;
      case 'maosuit': set({ pants: oc, boots: '#18181a', collar: oc }); break;
      case 'fatigues': set({ pants: shade(oc, -0.1), boots: '#2a2418', bootH: 5, belt: '#3a2e1a' }); break;
      case 'coat': set({ pants: '#e6e0d0', boots: '#141216', bootH: 7, collar: '#f2efe8' }); break;
      case 'armor':
        if (era <= 2) set({ sleeve: skin, bareArms: true, pants: skin, bareLegs: true, boots: '#6a4a2a', bootH: 4, skirt: ac, skirtTo: 5 });
        else set({ pants: shade(oc, -0.2), boots: shade(oc, -0.3), bootH: 6, belt: '#3a2a1a' });
        break;
      case 'plate': case 'tabard': set({ pants: oc, boots: shade(oc, -0.2), bootH: 5 }); break;
      case 'mail': set({ pants: '#4a3a2a', boots: '#3a2a1a', bootH: 5, belt: '#3a2a1a' }); break;
      case 'leather': set({ sleeve: '#d8ccb0', pants: '#4a3424', boots: '#3a2818', bootH: 6, belt: '#2a1a10' }); break;
      case 'samurai': set({ pants: '#2a2a3a', boots: '#3a2a1a', skirt: shade(oc, -0.1), skirtTo: 5 }); break;
      case 'robe': case 'cloak': set({ skirt: oc, skirtTo: 99, boots: '#2a1e14' }); break;
      case 'dress': case 'ruff': set({ skirt: oc, skirtTo: 99, boots: '#2a1e14' }); break;
      case 'toga': set({ torso: '#efebe0', sleeve: skin, bareArms: true, skirt: '#efebe0', skirtTo: 9, pants: skin, bareLegs: true, boots: '#7a5a34' }); break;
      case 'collar': set({ torso: skin, sleeve: skin, bareArms: true, skirt: '#f2eee2', skirtTo: 5, pants: skin, bareLegs: true, boots: '#b08850', collar: ac }); break;
      case 'shawl': set({ torso: '#f2eee6', sleeve: skin, bareArms: true, skirt: '#f2eee6', skirtTo: 8, pants: skin, bareLegs: true, boots: '#7a5a34' }); break;
      case 'pelt': set({ torso: oc, sleeve: skin, bareArms: true, skirt: oc, skirtTo: 5, pants: skin, bareLegs: true, boots: shade(oc, -0.15), bootH: 3 }); break;
      case 'fur': set({ skirt: oc, skirtTo: 6, pants: '#3a2a1a', boots: '#3a2a1a', bootH: 5, collar: ac }); break;
      case 'madiba': set({ pants: '#2a2a30', boots: '#18181a' }); break;
      case 'santa': set({ torso: '#c8102e', sleeve: '#c8102e', pants: '#b80e28', boots: '#141214', bootH: 6, belt: '#141214', collar: '#f4f0ea' }); break;
      case 'silver': set({ pants: shade(oc, -0.15), boots: shade(oc, -0.3), bootH: 6 }); break;
      case 'wraith': case 'void': set({ skirt: oc, skirtTo: 99, boots: oc }); break;
    }
    return d;
  }
  function leaderLook(id, variant) {
    const L = CW.LEADER[id];
    const p = L.pt;
    const sg = SIG[id] || {};
    const echo = variant === 'echo';
    const skin = echo ? '#aeb8cc' : p.sk || '#e2ad80';
    const hairC = p.hr || '#2a1a12';
    const look = outfitLook(p.out || 'suit', p.oc || '#555555', p.ac || '#d9b45a', skin, L.era);
    const w = CW.weaponOf(id);
    return Object.assign(look, {
      skin,
      eye: p.eyes || (echo ? '#2ee6ff' : ['#d9b45a', '#e9e6df', '#b5501f', '#8b3a1e', '#9c9c9c'].includes(hairC) ? '#3f7fc4' : '#8a5a34'),
      glow: !!(p.eyes || echo),
      male: !p.fem,
      p,
      sg,
      out: p.out || 'suit',
      oc: p.oc || '#555555',
      ac: p.ac || '#d9b45a',
      hair: hairC,
      hs: p.hs || 'short',
      head: p.head || 'human',
      weapon: w,
      ranged: GUNS.has(w) || w === 'bow',
      echo,
      team: null,
    });
  }
  // foot soldiers: their colours from the unit recipe, a helmet or hat for their era, and a team-coloured scarf
  const HATMAP = { wide: 'wide', tall: 'shako', round: 'helmetR', beret: 'beret', ops: 'ops', visor: 'visor', brodie: 'brodie' };
  function unitLook(uid, side) {
    const u = CW.UNIT[uid];
    const sp = u.sp;
    const body = sp.body || '#777777';
    const team = side === 'a' ? '#5aa8e0' : '#e05a4a';
    let headgear = HATMAP[sp.hat] || (sp.crest ? 'crest' : sp.horn ? 'horn' : sp.cap ? (u.era === 0 ? 'wild' : 'cap') : 'helm');
    return {
      skin: ['#e2ad80', '#c98f60', '#f2c9a0', '#a86e45'][(uid.length * 7) % 4],
      eye: '#6a4a2a',
      glow: false,
      male: true,
      torso: body,
      sleeve: body,
      pants: sp.legs || shade(body, -0.3),
      boots: u.era <= 1 ? '#6a4a2a' : '#22201e',
      bootH: u.era >= 5 ? 5 : 2,
      hands: u.era >= 11 ? shade(body, -0.25) : null,
      bareArms: u.era <= 1,
      bareLegs: false,
      skirt: u.era === 2 && u.role === 'inf' ? shade(body, -0.1) : null,
      skirtTo: 5,
      belt: u.era >= 2 ? '#2a1e14' : null,
      collar: team,
      team,
      helm: sp.helm || '#555555',
      headgear,
      weapon: sp.w,
      shield: sp.shield,
      ranged: u.role === 'rng',
      hs: 'short',
      hair: sp.helm || '#2a1a12',
      unit: true,
    };
  }

  // ---------------------------------------------------------------- dressing one frame
  const BARE = (L) => L.bareArms;
  function dress(fa, L, anim) {
    const out = new Uint8ClampedArray(FW * FH * 4);
    const { tone, reg, hx, hy, waist, legBottom } = fa;
    const skinR = ramp(L.skin);
    const eyeR = ramp(L.eye);
    const pick = (r, t) => r[t];
    const n = FW * FH;
    // ---- back layer: cape, long hair, skirt flare, sack, tail
    const back = new Buf();
    const sg = L.sg || {};
    const cape = sg.cape || (L.out === 'cloak' ? L.oc : null);
    if (cape) {
      setT(hx, hy);
      poly(back, [[-4, 10], [5, 10], [3, 20], [-1, 30], [-9, 34], [-15, 32], [-17, 26], [-11, 20], [-7, 14]], cape, part(back), { gain: 0.8 });
    }
    if (sg.tail) {
      setT(hx, hy);
      const t = part(back);
      cap(back, -3, 24, -12, 30, 0.9, 0.8, sg.tail, t);
      cap(back, -12, 30, -16, 24, 0.8, 0.8, sg.tail, t);
      poly(back, [[-18, 21], [-14, 23], [-18, 26]], sg.tail, t);
    }
    if (sg.sack) {
      setT(hx, hy);
      ell(back, -9, 15, 6, 7, sg.sack, part(back), { bias: 0.25 });
    }
    if (L.head === 'human' && !['nemes', 'kabuto', 'greek', 'spacehelm'].includes(L.p && L.p.hat)) {
      setT(hx, hy);
      hairBack(back, L.hs, L.hair);
    }
    if (L.skirt && L.skirtTo === 99) {
      setT(hx, waist);
      poly(back, [[-6, -1], [8, -1], [11, legBottom - waist + 1], [-8, legBottom - waist + 1]], L.skirt, part(back), { gain: 0.7 });
    }
    if (L.unit && L.shield && fa) {
      setT(hx - 7, hy + 17);
      ell(back, 0, 0, 4.6, 5.6, L.shield, part(back), { bias: 0.25 });
    }
    flatten(back, out, true);
    // ---- the body, recoloured part by part
    const footFrom = legBottom - 2 - (L.bootH || 2);
    for (let i = 0; i < n; i++) {
      const t = tone[i];
      if (t < 0) continue;
      const y = (i / FW) | 0;
      let c;
      if (t >= 6) {
        // eyes: keep the whites and the dark lines, recolour the iris
        if (t === 8) c = L.glow ? lift(rgb(L.eye), 0.3) : eyeR[1];
        else if (t === 9) c = L.glow ? rgb(L.eye) : eyeR[3];
        else if (t === 6 && L.glow) c = lift(rgb(L.eye), 0.6);
        else c = t === 6 ? [242, 247, 248] : [42, 40, 50];
      } else {
        let r = reg[i];
        let col;
        if (r === 1 || r === 2) col = r === 2 && L.collar ? L.collar : L.skin;
        else if (r === 3) col = L.belt && y >= waist - 2 && y <= waist - 0.5 ? L.belt : L.torso;
        else if (r === 4) col = L.bareArms ? L.skin : L.sleeve;
        else if (r === 5) col = L.hands || L.skin;
        else {
          const skirt = L.skirt && (L.skirtTo === 99 || y <= waist + L.skirtTo);
          col = skirt ? L.skirt : y >= footFrom || r === 7 ? L.boots : L.bareLegs ? L.skin : L.pants;
        }
        const rr = col === L.skin ? skinR : ramp(col);
        // a bare chest stays flat for men
        let tt = t;
        if (tt === 0 && L.male && r === 3) tt = 1;
        c = pick(rr, tt);
      }
      out[i * 4] = c[0];
      out[i * 4 + 1] = c[1];
      out[i * 4 + 2] = c[2];
      out[i * 4 + 3] = 255;
    }
    // ---- front layer: chest details, hair, hat, face, weapon
    const fr = new Buf();
    setT(hx, hy);
    const tx = hx + 1.5;
    if (L.belt) {
      setT(tx, waist - 1);
      dot(fr, 0, 0, '#d9b45a');
    }
    setT(hx, hy);
    if (sg.tie || (L.out === 'suit' && !L.unit)) {
      const tc = sg.tie || L.ac;
      for (let y = 11; y < 19; y++) dot(fr, 2.5, y, y < 12 ? tc : shade(tc, y % 2 ? 0 : -0.15));
    }
    if (L.out === 'uniform' && !L.unit) for (let y = 12.5; y < 22; y += 3) dot(fr, 2.5, y, L.ac);
    if (sg.sash) for (let i = 0; i < 12; i++) dot(fr, -3 + i, 11 + i * 1.05, i % 2 ? sg.sash : shade(sg.sash, -0.2));
    if (L.p && L.p.medals) {
      const mc = ['#d9b45a', '#c8102e', '#2a6aa8', '#e8e4dc'];
      for (let i = 0; i < Math.min(6, L.p.medals * 3); i++) dot(fr, -1.5 + (i % 3), 14 + Math.floor(i / 3) * 1.6, mc[i % 4]);
    }
    if (L.out === 'santa') for (let y = 11; y < 25; y++) dot(fr, 2, y, '#f4f0ea');
    if (L.out === 'ruff') ell(fr, 1.5, 10.5, 7, 2.4, '#f6f3ee', part(fr), { bias: 0.3 });
    if (L.p && (L.p.pearls || L.id === 'elizabeth2')) for (let x = -1; x < 5; x++) dot(fr, x + 0.5, 11, '#f4f0ea');
    // head
    if (!L.unit) {
      const p = L.p;
      if (L.head === 'alien') {
        ell(fr, 0.5, 0.5, 10.6, 10.8, L.skin, part(fr), { bias: 0.25 });
        ell(fr, 0.5, 4.5, 2.4, 3.6, '#0a0a10', part(fr), { noOL: true, tone: 1 });
        ell(fr, 5.5, 4.8, 1.8, 3.2, '#0a0a10', part(fr), { noOL: true, tone: 1 });
      } else if (L.head === 'screen') {
        poly(fr, [[-11, -10], [11, -10], [12, 9.5], [-12, 9.5]], p.hc || '#3a3f4a', part(fr), { gain: 0.7 });
        poly(fr, [[-9, -8], [9.5, -8], [10, 7], [-9.5, 7]], '#06181a', part(fr), { tone: 1, noOL: true });
        for (let x = -5; x < -1; x++) dot(fr, x, -1, p.sk || '#2ee6ff');
        for (let x = 3; x < 7; x++) dot(fr, x, -1, p.sk || '#2ee6ff');
        for (let x = -2; x < 5; x++) dot(fr, x, 4, p.sk || '#2ee6ff');
      } else if (L.head === 'insect') {
        ell(fr, 0, 0, 10, 10.5, L.skin, part(fr), { bias: 0.2 });
        ell(fr, -4, 0, 3.6, 4.4, '#a8141c', part(fr), { bias: 0.4 });
        ell(fr, 5, 0, 3.6, 4.4, '#a8141c', part(fr), { bias: 0.4 });
        cap(fr, -3, -9, -7, -16, 0.6, 0.5, L.skin, part(fr));
        cap(fr, 4, -9, 8, -16, 0.6, 0.5, L.skin, part(fr));
      } else if (L.head === 'hood') {
        poly(fr, [[-12, 10], [-10, -8], [0, -14], [11, -8], [12, 10], [6, 12], [-6, 12]], p.oc || '#1a1420', part(fr), { gain: 0.8 });
        ell(fr, 1.5, 3, 6.5, 6.5, '#050308', part(fr), { tone: 1, noOL: true });
        dots(fr, [[-1, 3], [0, 3], [3.5, 3], [4.5, 3]], p.eyes || '#7dffb0');
      } else {
        if (p.cosmic) for (let i = 0; i < 9; i++) dot(fr, -7 + ((i * 7) % 15), -5 + ((i * 5) % 13), i % 2 ? '#ffffff' : '#d08aff');
        if (p.cyborg) {
          poly(fr, [[3, -2], [9.5, -3], [9.5, 8], [3.5, 8]], '#9aa0aa', part(fr), { gain: 0.6 });
          dots(fr, [[5.5, 5], [6.5, 5]], '#ff2a2a');
        }
        hair(fr, L, L.hs, L.hair, p.hat);
        if (p.mark) ell(fr, -0.5, -7, 2.6, 1.4, typeof p.mark === 'string' ? p.mark : '#b8504a', part(fr), { noOL: true, tone: 1 });
        // brows, mouth, cheeks
        const brow = shade(p.fc || (L.hair === '#e9e6df' ? '#9c9c9c' : L.hair), -0.35);
        dots(fr, [[0.5, 3.2], [1.5, 3], [2.7, 3], [3.7, 2.8]], brow);
        if (p.unibrow) dot(fr, 2.1, 3.2, brow);
        dot(fr, 3.5, 8.6, p.fem ? '#c0505a' : shade(L.skin, -0.4));
        if (p.fem || p.rosy) dots(fr, [[5, 7.4], [6, 7.4]], '#ec8a86');
        if (p.grin) dots(fr, [[2.5, 8.6], [4.5, 8.6]], '#3a1418');
        beard(fr, p.fh || 'none', p.fc || L.hair, L.skin);
        const gl = p.gl || (sg.glasses ? 1 : sg.shades ? 2 : 0);
        if (gl === 1) {
          const gc = '#2a2a2a';
          for (let x = -0.5; x <= 4.5; x++) {
            dot(fr, x, 3.6, gc);
            dot(fr, x, 7.6, gc);
          }
          dots(fr, [[-0.8, 4.6], [-0.8, 5.6], [-0.8, 6.6], [4.8, 4.6], [4.8, 5.6], [4.8, 6.6]], gc);
        } else if (gl === 2) poly(fr, [[-1, 3.6], [6, 3.4], [5.8, 6.8], [3.5, 7], [2, 5.8], [0, 6.8], [-1, 6.4]], '#141418', part(fr), { gain: 0.4 });
        if (p.acc === 'eyepatch') {
          poly(fr, [[2, 3.6], [5, 3.6], [5, 7], [2, 7]], '#141414', part(fr), { tone: 1 });
          dots(fr, [[-6, -2], [-3, 0], [0, 2], [1.5, 3.6], [5.5, 3], [7, 2]], '#141414');
        }
        if (p.acc === 'cigar' || sg.cigar) {
          cap(fr, 4, 9, 9, 9.6, 0.7, 0.7, '#6a3a1a', part(fr));
          dot(fr, 9.6, 9.6, '#ff7a2a');
        }
        if (sg.pipe) {
          cap(fr, 4, 9, 8, 10.4, 0.5, 0.5, '#3a2418', part(fr));
          ell(fr, 9, 9.6, 1.3, 1.7, '#5a3420', part(fr));
        }
        if (p.acc === 'holder') {
          cap(fr, 4, 9, 10.5, 6.5, 0.35, 0.35, '#1a1a1a', part(fr));
          cap(fr, 10.5, 6.5, 12.5, 6, 0.5, 0.5, '#f4f0ea', part(fr));
        }
        if (p.acc === 'bone') cap(fr, -6, -10, 4, -11.5, 0.8, 0.8, '#efe8d8', part(fr));
        if (p.acc === 'mic' && L.weapon !== 'mic') cap(fr, 6, 9, 8, 7, 0.6, 0.6, '#9aa0a8', part(fr));
        if (p.hat) headwear(fr, p.hat, p.hc || '#2a2a2a', p.ha || L.ac, p.plume);
      }
    } else {
      // soldiers: hair or helmet
      const hg = L.headgear;
      const hc = L.helm;
      const H = part(fr);
      if (hg === 'wild') hair(fr, L, 'wild', hc, null);
      else if (hg === 'cap') ell(fr, -0.5, -4.5, 10.6, 6.6, hc, H, { clip: (x, y) => y < -0.5, bias: 0.25 });
      else if (hg === 'helm' || hg === 'crest' || hg === 'horn' || hg === 'helmetR' || hg === 'brodie') {
        ell(fr, -0.5, -2, 11.2, 9.4, hc, H, { clip: (x, y) => y < (hg === 'brodie' ? -1 : 1.2) || (x < -3 && y < 6), bias: 0.25 });
        if (hg === 'brodie') cap(fr, -14, -1, 13, -1.4, 0.9, 0.9, hc, H);
        if (hg === 'crest') poly(fr, [[-6, -10], [3, -12.5], [9, -8], [3, -9.5], [-4, -8.5]], L.team, part(fr), { gain: 0.6 });
        if (hg === 'horn') {
          poly(fr, [[-8, -7], [-5, -8], [-10, -15], [-12, -12]], '#e8dcc0', part(fr), { bias: 0.3 });
          poly(fr, [[5, -8], [8, -7], [12, -13], [10, -15]], '#e8dcc0', part(fr), { bias: 0.3 });
        }
        // rim and shine so a helmet reads as metal, not hair
        if (hg !== 'brodie') cap(fr, -10.8, 1, 9.5, 0.2, 0.7, 0.7, shade(hc, -0.25), part(fr));
        dots(fr, [[2, -7], [3, -7], [4, -6], [-2, -8]], shade(hc, 0.55));
      } else if (hg === 'wide') {
        hair(fr, L, 'short', '#3a2a1a', 'x');
        poly(fr, [[-15, -3], [-8, -7], [-6, -12], [2, -13.5], [8, -11], [10, -6.5], [16, -3], [8, -1.6], [-8, -1.6]], hc, H, { gain: 0.6 });
      } else if (hg === 'shako') {
        hair(fr, L, 'short', '#2a1a12', 'x');
        poly(fr, [[-8, -4], [8.5, -4.5], [8, -16], [-7.5, -16]], hc, H, { gain: 0.6 });
        cap(fr, 1, -5, 12, -5, 0.8, 0.8, '#141418', part(fr));
        dot(fr, 1, -12, L.team);
        dot(fr, 1, -13, L.team);
      } else if (hg === 'beret') {
        hair(fr, L, 'short', '#2a1a12', 'x');
        ell(fr, 1, -7, 11, 4.2, hc, H, { bias: 0.2 });
      } else if (hg === 'ops') {
        ell(fr, -0.5, -1, 11, 10, hc, H, { clip: (x, y) => !(x > -1 && y > 2.5 && y < 8), bias: 0.2 });
        dots(fr, [[0.5, 4.4], [1.5, 4.4], [3, 4.4], [4, 4.4]], '#7dffb0');
      } else if (hg === 'visor') {
        ell(fr, -0.5, -0.8, 10.6, 9.8, hc, H, { bias: 0.25 });
        poly(fr, [[-0.5, 2.6], [10, 2.2], [10, 6.2], [-0.5, 6.8]], '#1a2a3a', part(fr), { tone: 1 });
        for (let x = 0; x < 10; x++) dot(fr, x + 0.5, 4, '#2ee6ff');
        cap(fr, -10.5, 8, 9.5, 8, 0.6, 0.6, shade(hc, -0.3), part(fr));
      }
    }
    // shields carried on the far side
    if (sg.shield) {
      setT(hx - 7.5, hy + 18);
      const s = part(fr);
      const sc = sg.shield.c;
      if (sg.shield.kite) poly(fr, [[-5, -7], [5, -7], [5, 1], [0, 9], [-5, 1]], sc, s, { gain: 0.9 });
      else if (sg.shield.oval) ell(fr, 0, 1, 4.6, 8.4, sc, s);
      else ell(fr, 0, 0, sg.shield.small ? 4.4 : 6.6, sg.shield.small ? 4.4 : 6.6, sc, s, { bias: 0.25 });
      if (sg.shield.mark === 'lambda') for (let i = 0; i < 5; i++) {
        dot(fr, -i * 0.6, -2.5 + i, sg.shield.e);
        dot(fr, i * 0.6, -2.5 + i, sg.shield.e);
      }
      else ell(fr, 0, 0, 1.6, 1.6, sg.shield.e, part(fr), { noOL: true });
    }
    // the weapon: placed at the hand that's doing the work, angled along the arm
    const w = L.weapon;
    if (w && w !== 'none') {
      const fight = anim === 'thrust' || anim === 'swing' || anim === 'shoot' || anim === 'throw';
      const h = fa.wh || (fight && fa.hands.length ? fa.hands.reduce((a, b) => (b.x > a.x ? b : a)) : null);
      let ax = hx + 8.6;
      let ay = hy + 20;
      let ang = 0.9; // resting: blade pointing down and forward
      const pole = GRIP[w] >= 2;
      if (h) {
        ax = h.x;
        ay = h.y;
        const sx = hx + 3;
        const sy = hy + 12;
        ang = Math.atan2(ay - sy, ax - sx);
      }
      if (GUNS.has(w)) ang = fight ? Math.max(-0.25, Math.min(0.25, ang)) : 0.3;
      else if (w === 'bow') ang = 0;
      else if (pole && !fight) ang = -Math.PI / 2 + 0.12;
      else if (pole && fight) ang = Math.max(-0.9, Math.min(0.2, ang));
      else if (w === 'flag' || w === 'candy') ang = -Math.PI / 2 + 0.05;
      if (w === 'flag' || w === 'candy' || (pole && !fight)) ang = -Math.PI / 2 + 0.08;
      if (['rock', 'grenade', 'sling', 'mic', 'book', 'handbag'].includes(w)) ang = 0;
      setT(ax, ay, ang);
      weapon(fr, w, { glow: L.p && L.p.eyes, flag: sg.flag || L.ac, orb: L.p && L.p.eyes, walk: sg.walk, book: sg.book, club: sg.club, pole: sg.pole, tip: sg.tip });
      // the hand over the grip
      setT(ax, ay);
      if (!L.unit || L.weapon) ell(fr, 0, 0, 1.6, 1.6, L.hands || L.skin, part(fr), { bias: 0.3 });
    }
    setT(0, 0);
    flatten(fr, out, true, true);
    // a final outline around everything that touches empty space
    const fin = new Uint8ClampedArray(out);
    for (let i = 0; i < n; i++) {
      if (out[i * 4 + 3]) continue;
      const x = i % FW;
      for (const d of [-1, 1, -FW, FW]) {
        const j = i + d;
        if (j < 0 || j >= n || (d === -1 && x === 0) || (d === 1 && x === FW - 1) || !out[j * 4 + 3]) continue;
        const lum = out[j * 4] + out[j * 4 + 1] + out[j * 4 + 2];
        if (lum < 140) continue;
        fin[i * 4] = 30;
        fin[i * 4 + 1] = 20;
        fin[i * 4 + 2] = 30;
        fin[i * 4 + 3] = 255;
        break;
      }
    }
    return fin;
  }
  void BARE;

  // ---------------------------------------------------------------- frame canvases, cached
  function toCanvas(px, flip) {
    const c = document.createElement('canvas');
    c.width = FW;
    c.height = FH;
    const g = c.getContext('2d', { willReadFrequently: true });
    const img = g.createImageData(FW, FH);
    if (flip) {
      for (let y = 0; y < FH; y++)
        for (let x = 0; x < FW; x++) {
          const s = (y * FW + x) * 4;
          const d = (y * FW + (FW - 1 - x)) * 4;
          img.data[d] = px[s];
          img.data[d + 1] = px[s + 1];
          img.data[d + 2] = px[s + 2];
          img.data[d + 3] = px[s + 3];
        }
    } else img.data.set(px);
    g.putImageData(img, 0, 0);
    return c;
  }
  const lookCache = new Map();
  const frameCache = new Map();
  // a dressed frame: who (leader id or unit id), how they're dressed, which animation and frame, mirrored or not
  function frame(kind, who, side, variant, anim, i, flip) {
    const key = kind + who + side + (variant || '') + anim + i + (flip ? 'f' : '');
    let c = frameCache.get(key);
    if (c) return c;
    if (!ready) return null;
    const A = ANIM[anim];
    const fa = frames[A.row + ':' + A.f[i % A.f.length]];
    const lk = kind + who + side + (variant || '');
    let look = lookCache.get(lk);
    if (!look) {
      look = kind === 'L' ? leaderLook(who, variant) : unitLook(who, side);
      look.id = who;
      lookCache.set(lk, look);
    }
    c = toCanvas(dress(fa, look, anim), flip);
    frameCache.set(key, c);
    return c;
  }
  CW.bodyFW = FW;
  CW.bodyFH = FH;
  // which attack animation a fighter uses
  CW.attackAnim = function (kind, who) {
    if (kind === 'L') {
      const w = CW.weaponOf(who);
      return GUNS.has(w) || w === 'bow' ? 'shoot' : ['none', 'book', 'mic', 'handbag'].includes(w) ? 'throw' : 'swing';
    }
    const u = CW.UNIT[who];
    const w = u.sp.w;
    if (['rock', 'javelin', 'grenade', 'sling'].includes(w)) return 'throw';
    if (GUNS.has(w) || w === 'bow') return 'shoot';
    return u.role === 'inf' && ['spear', 'lance'].includes(w) ? 'thrust' : 'swing';
  };
  CW.usesBody = (uid) => CW.UNIT[uid].sp.k === 'soldier';
  CW.leaderFrame = (id, side, variant, anim, i, flip) => frame('L', id, side, variant, anim, i, flip === undefined ? side === 'e' : flip);
  CW.unitFrame = (uid, side, anim, i, flip) => frame('U', uid, side, '', anim, i, flip === undefined ? side === 'e' : flip);
  CW.bodiesLoaded = () => ready;

  // ---------------------------------------------------------------- cards and icons
  // unit icons: foot soldiers show their dressed base figure, everything else its own sprite
  const uurl = {};
  CW.unitURL = function (uid) {
    if (uurl[uid]) return uurl[uid];
    const c = document.createElement('canvas');
    c.width = 52;
    c.height = 52;
    const g = c.getContext('2d');
    const f = CW.usesBody(uid) ? frame('U', uid, 'a', '', 'idle', 0, false) : null;
    if (f) g.drawImage(f, 2, 0);
    else {
      const sp = CW.unitSprite(uid, 'a');
      const k = Math.min(1, 50 / sp.c.width, 48 / sp.c.height);
      g.imageSmoothingEnabled = false;
      g.drawImage(sp.c, Math.floor((52 - sp.c.width * k) / 2), Math.floor((52 - sp.c.height * k) / 2), Math.round(sp.c.width * k), Math.round(sp.c.height * k));
    }
    if (!f && CW.usesBody(uid)) return c.toDataURL();
    return (uurl[uid] = c.toDataURL());
  };

  const QMARK = ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'];
  const pcache = {};
  CW.portrait = function (id, variant) {
    const key = id + '|' + (variant || '');
    if (pcache[key]) return pcache[key];
    const L = CW.LEADER[id];
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    const bg = variant === 'mystery' ? '#2a1240' : variant === 'echo' ? '#141a2e' : L.pt.bg || '#2a2a2a';
    const grd = g.createLinearGradient(0, 0, 0, 64);
    grd.addColorStop(0, shade(bg, 0.12));
    grd.addColorStop(1, shade(bg, -0.35));
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(0,0,0,.28)';
    g.beginPath();
    g.ellipse(32, 60, 14, 2.6, 0, 0, Math.PI * 2);
    g.fill();
    const f = frame('L', id, 'a', variant === 'mystery' ? '' : variant, 'idle', 0, false);
    if (!f) return c; // the base sheet isn't loaded yet; don't cache
    if (variant === 'mystery') {
      g.drawImage(CW.tinted(f, '#0a0710'), 8, 10);
      g.fillStyle = '#e8d0ff';
      QMARK.forEach((r, y) => r.split('').forEach((k, x) => k === '#' && g.fillRect(27 + x * 2, 18 + y * 2, 2, 2)));
    } else g.drawImage(f, 8, 10);
    pcache[key] = c;
    return c;
  };
  const urlCache = {};
  CW.portraitURL = function (id, variant) {
    const key = id + '|' + (variant || '');
    if (!urlCache[key]) {
      const c = CW.portrait(id, variant);
      if (!pcache[key]) return c.toDataURL();
      urlCache[key] = c.toDataURL();
    }
    return urlCache[key];
  };
  const headCache = {};
  CW.headURL = function (id, variant) {
    const key = id + '|' + (variant || '');
    if (!headCache[key]) {
      const p = CW.portrait(id, variant);
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      c.getContext('2d').drawImage(p, 16, 8, 32, 32, 0, 0, 32, 32);
      if (!pcache[key]) return c.toDataURL();
      headCache[key] = c.toDataURL();
    }
    return headCache[key];
  };
})(typeof window !== 'undefined' ? window : globalThis);
