




import React, { useRef, useEffect, useState, useCallback } from 'react';





interface SquaresProps {


  direction?: 'right' | 'left' | 'up' | 'down' | 'diagonal';


  speed?: number;


  borderColor?: string;


  squareSize?: number;


  hoverFillColor?: string;


  className?: string;


  mousePosition?: { x: number; y: number } | null;


}





const Squares: React.FC<SquaresProps> = ({


  direction = 'right',


  speed = 1,


  borderColor = '#999',


  squareSize = 40,


  hoverFillColor = '#222',


  className = '',


  mousePosition = null,


}) => {


  const canvasRef = useRef<HTMLCanvasElement>(null);


  const requestRef = useRef<number>();


  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });





  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {


    ctx.clearRect(0, 0, canvas.width, canvas.height);





    let hoveredSquare: { x: number, y: number } | null = null;


    if (mousePosition) {


        const rect = canvas.getBoundingClientRect();


        const mouseX = mousePosition.x - rect.left;


        const mouseY = mousePosition.y - rect.top;





        const startX = Math.floor(gridOffset.x / squareSize) * squareSize;


        const startY = Math.floor(gridOffset.y / squareSize) * squareSize;





        const hoveredSquareX = Math.floor((mouseX + gridOffset.x - startX) / squareSize);


        const hoveredSquareY = Math.floor((mouseY + gridOffset.y - startY) / squareSize);


        hoveredSquare = { x: hoveredSquareX, y: hoveredSquareY };


    }








    const startX = Math.floor(gridOffset.x / squareSize) * squareSize;


    const startY = Math.floor(gridOffset.y / squareSize) * squareSize;





    for (let x = startX; x < canvas.width + squareSize; x += squareSize) {


      for (let y = startY; y < canvas.height + squareSize; y += squareSize) {


        const squareX = x - (gridOffset.x % squareSize);


        const squareY = y - (gridOffset.y % squareSize);





        if (


          hoveredSquare &&


          Math.floor((x - startX) / squareSize) === hoveredSquare.x &&


          Math.floor((y - startY) / squareSize) === hoveredSquare.y


        ) {


          ctx.fillStyle = hoverFillColor;


          ctx.fillRect(squareX, squareY, squareSize, squareSize);


        }





        ctx.strokeStyle = borderColor;


        ctx.strokeRect(squareX, squareY, squareSize, squareSize);


      }


    }





    const gradient = ctx.createRadialGradient(


      canvas.width / 2,


      canvas.height / 2,


      0,


      canvas.width / 2,


      canvas.height / 2,


      Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2


    );


    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');





    ctx.fillStyle = gradient;


    ctx.fillRect(0, 0, canvas.width, canvas.height);


  }, [gridOffset, mousePosition, borderColor, hoverFillColor, squareSize]);





  const updateAnimation = useCallback(() => {


    const effectiveSpeed = Math.max(speed, 0.1);


    setGridOffset(prevOffset => {


      let { x, y } = prevOffset;


      switch (direction) {


        case 'right':


          x = (x - effectiveSpeed + squareSize) % squareSize;


          break;


        case 'left':


          x = (x + effectiveSpeed + squareSize) % squareSize;


          break;


        case 'up':


          y = (y + effectiveSpeed + squareSize) % squareSize;


          break;


        case 'down':


          y = (y - effectiveSpeed + squareSize) % squareSize;


          break;


        case 'diagonal':


          x = (x - effectiveSpeed + squareSize) % squareSize;


          y = (y - effectiveSpeed + squareSize) % squareSize;


          break;


        default:


          break;


      }


      return { x, y };


    });


    requestRef.current = requestAnimationFrame(updateAnimation);


  }, [direction, speed, squareSize]);








  useEffect(() => {


    const canvas = canvasRef.current;


    if (!canvas) return;


    const ctx = canvas.getContext('2d');


    if (!ctx) return;





    const resizeCanvas = () => {


      canvas.width = canvas.offsetWidth;


      canvas.height = canvas.offsetHeight;


      drawGrid(ctx, canvas);


    };





    window.addEventListener('resize', resizeCanvas);


    resizeCanvas();





    // Redraw whenever mouse position changes


    drawGrid(ctx, canvas);





    requestRef.current = requestAnimationFrame(updateAnimation);





    return () => {


      window.removeEventListener('resize', resizeCanvas);


      if (requestRef.current) {


        cancelAnimationFrame(requestRef.current);


      }


    };


  }, [drawGrid, updateAnimation, mousePosition]);








  return (


    <canvas


      ref={canvasRef}


      className={`squares-canvas ${className}`}


    />


  );


};





export default Squares;
