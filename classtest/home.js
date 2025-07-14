function Home()
{
    let heading=document.getElementById('heading');
    heading.textContent='Welcome to the Home Page!';
    let para=document.getElementById('content');
    para.innerHTML='This is the home page of our application.<br>Here you can find various resources and links to navigate through the site.';
}

function About()
{
    let heading=document.getElementById('heading');
    heading.textContent='About us';
    let para=document.getElementById('content');
    para.textContent='This is the about section';
}

function Contact()
{
    let heading=document.getElementById('heading');
    heading.textContent='Contact us';
    let para=document.getElementById('content');
    para.textContent='Contact us at: samuelcsofficial@gmail.com';
}

