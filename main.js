const windowWidth = $(window).width();
const windowHeight = $(window).height();

$(window).resize(function() {
    if (
        windowWidth != $(window).width() ||
        windowHeight != $(window).height()
    ) {
        location.reload();
        return;
    }
});
const width = windowWidth;
const height = 850;

let tooltip = floatingTooltip('gates_tooltip', 240, 10);

const categories = ["Best actor", "Best actress", "Best supporting actor", "Best supporting actress", "Best director"];
const cat2023 = d3.scaleOrdinal().domain(categories).range(["#3b7145", "#b7886a", "#b3d8d4", "#eac1b4", "#fdc086"]);
let activeArray = categories;
let inactiveArray = [];
let idsPerCat = [];

categories.forEach(cat => {
    let obj = {};
    obj.category = cat;
    obj.ids = [];
    links.forEach(link => {
        if (link.category === cat) {
            obj.ids.push(link.target);
        }
    })
    idsPerCat.push(obj)
})

const textureArray = categories.map(d => {
    return textures
        .lines()
        .size(6)
        .strokeWidth(3)
        .stroke(cat2023(d))
        .background("white");
})

const textureScale = d3.scaleOrdinal().domain(categories).range(textureArray);


const drag = simulation => {

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody().strength(-285).theta(0.1))
    .force("x", d3.forceX())
    .force("y", d3.forceY())

const divButtons = d3.select("#buttons")
    .append("div")
    .attr("width", width)

divButtons.selectAll("p").data(categories).join("p").attr("class", "button").attr("id", d => d.replaceAll(" ", "_")).html(d => d)
    .style("border", d => `1px solid ${cat2023(d)}`).style("background", d => cat2023(d))
    .on("click", (e, d) => toggle(d))

const svg = d3.select("#chart").append("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("font-size", "13")

for (let t of textureArray) {
    svg.call(t);
}


const link = svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("class", d => {
        let catID = "";
        if (d.cat2023Ref) {
            catID = catID + `refLink-${d.cat2023Ref.replaceAll(" ","_")} `
        }

        let cat2024 = ""
        if (d.year === 2023) {
            cat2024 = `link-${d.category.replaceAll(" ","_")}`;
        }
        return `source${d.source.id} target${d.target.id} links ${catID} ${cat2024}`
    })
    .attr("stroke", d => cat2023(d.category))
    .attr("stroke-width", d => d.won === "won" ? 5 : 2)


const node = svg.append("g")
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("fill", d => {
        if (d.type === 'film') {
            return '#574d42';
        } else {
            if (d.won === "yes") {
                return textureScale(d.category2023).url()
            } else {
                return cat2023(d.category2023);
            }
        }
    })
    .call(drag(simulation));


node.append("circle")
    .attr("r", d => d.type === 'film' ? 4 : 18)
    .attr("class", d => {
        let filmID = "";
        if (d.type === "film") {
            filmID = `film_${d.id}`
        }

        // add references to 2023 categories so if none of the categories are active then remove
        let catID = "";
        if (d.type === "film") {
            if (d.cat2023Ref) {
                d.cat2023Ref.forEach(refCat => {
                    catID = catID + `ref-${refCat.replaceAll(" ","_")} `
                })
            }
        } else {
            catID = d.category2023.replaceAll(" ", "_");
        }

        return `${filmID} ${catID} node${d.id} nodes`
    })
    .on("mouseover", (e, d) => {
        let content;
        if (d.type === "person") {
            content = `<span> <b>${d.person}</b>${d.won==="yes"?" (2024 winner)":""}</span> <br>
          <span class="category" style = "background-color:${cat2023(d.category2023)}">${d.category2023}</span> <br>
          ${d.totalWon} win${d.totalWon>1?"s":""} out of ${d.totalNoms}  nomination${d.totalNoms>1?"s":""} overall. <br>
          ${d.totalNoms2023} nomination${d.totalNoms2023>1?"s":""} in 2024 in the following: ${d.totalNoms2023Cats.toString()}`;
        } else {
            content = `<span> <b>${d.person}</b>  </span>${d.Is2023==="yes"?"(2024)":""} <br>
          ${d.totalWon} win${d.totalWon>1?"s":""} out of ${d.totalNom} Oscars nomination${d.totalNom>1?"s":""}`
        }
        tooltip.showTooltip(content, e);

        d3.select(`.node${d.id}`).attr("stroke", "black")
        if (d.type === "person") {
            d3.selectAll(`.source${d.id}`)
                .each(function() {
                    // console.log(d3.select(this).attr("d"))
                    const length = d3.select(this).node().getTotalLength();
                    d3.select(this).attr("stroke-dasharray", length + " " + length)
                        .attr("stroke-dashoffset", length)
                        .transition()
                        .ease(d3.easeLinear)
                        .attr("stroke-dashoffset", 0)
                        .duration(200)
                })
                .attr("stroke", "black")
        } else {
            d3.selectAll(`.target${d.id}`)
                .each(function() {
                    const length = d3.select(this).node().getTotalLength();
                    d3.select(this).attr("stroke-dasharray", length + " " + length)
                        .attr("stroke-dashoffset", -length) // make negative for opposite direction
                        .transition()
                        .ease(d3.easeLinear)
                        .attr("stroke-dashoffset", 0)
                        .duration(200)
                })
                .attr("stroke", "black")
        }
    })
    .on("mouseout", (e, d) => {
        tooltip.hideTooltip();
        d3.selectAll(".links").attr("stroke", d => cat2023(d.category))
        d3.selectAll(".nodes").attr("stroke", "none")
    })

node.append("text")
    .attr("class", d => {
        let filmID = "";
        if (d.type === "film") {
            filmID = `filmText_${d.id}`
        }
        // add references to 2023 categories so if none of the categories are active then remove
        let catID = "";
        if (d.type === "film") {
            if (d.cat2023Ref) {
                d.cat2023Ref.forEach(refCat => {
                    catID = catID + `refText-${refCat.replaceAll(" ","_")} `
                })
            }
        } else {
            catID = d.category2023.replaceAll(" ", "_");
        }
        return `${filmID} ${catID} text${d.id}`
    })
    .attr("x", 8)
    .attr("y", "1em")
    .attr("fill", d => d.Is2023 === "yes" ? "black" : "#636363")
    .style("font-weight", d => d.Is2023 === "yes" ? 700 : 400)
    .text(d => d.person)
    .clone(true).lower()
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 3);


simulation.on("tick", () => {
    link.attr("d", linkArc);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
})

function linkArc(d) {
    const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
    `;
}


function toggle(id) {
    let idCleaned = id.replaceAll(" ", "_");

    if (activeArray.includes(id)) { //remove
        d3.select(`#${idCleaned}`).style("background", "white");
        activeArray = activeArray.filter(d => d !== id)
        inactiveArray.push(id)
        // console.log(activeArray)
        d3.selectAll(`.${idCleaned}`).style("opacity", 0)
        // remove other links and films
        // look for the cat in idsPerCat, remove all the ids,
        idsPerCat.forEach(cat => {
            if (cat.category === id) {
                cat.ids.forEach(filmID => {
                    d3.selectAll(`.film_${filmID}`).style("opacity", 0)
                    d3.selectAll(`.filmText_${filmID}`).style("opacity", 0)
                })
            }
        })
        // add back the ones that exist in another active category

        idsPerCat.forEach(cat => {
            if (activeArray.includes(cat.category)) {
                cat.ids.forEach(filmID => {
                    d3.selectAll(`.film_${filmID}`).style("opacity", 1)
                    d3.selectAll(`.filmText_${filmID}`).style("opacity", 1)
                })
            }
        })

        // remove the nodes and links for those that are linked to a person with an inactive category
        // , but add back later if active

        inactiveArray.forEach(cat => {
            let catCleaned = cat.replaceAll(" ", "_")
            d3.selectAll(`.ref-${catCleaned}`).style("opacity", 0)
            d3.selectAll(`.refText-${catCleaned}`).style("opacity", 0)
            d3.selectAll(`.refLink-${catCleaned}`).style("opacity", 0)
        })

        // add back those where at least one of the cats are active
        activeArray.forEach(cat => {
            let catCleaned = cat.replaceAll(" ", "_")
            d3.selectAll(`.ref-${catCleaned}`).style("opacity", 1)
            d3.selectAll(`.refText-${catCleaned}`).style("opacity", 1)
            d3.selectAll(`.refLink-${catCleaned}`).style("opacity", 1)
        })
        d3.selectAll(`.link-${idCleaned}`).style("opacity", 0)


    } else { // add
        d3.select(`#${idCleaned}`).style("background", cat2023(id));
        activeArray.push(id)
        inactiveArray = inactiveArray.filter(d => d !== id)

        // console.log(activeArray)
        d3.selectAll(`.${idCleaned}`).style("opacity", 1)

        idsPerCat.forEach(cat => {
            if (cat.category === id) {
                cat.ids.forEach(filmID => {
                    d3.selectAll(`.film_${filmID}`).style("opacity", 1)
                    d3.selectAll(`.filmText_${filmID}`).style("opacity", 1)
                })
            }
        })

        inactiveArray.forEach(cat => {
            let catCleaned = cat.replaceAll(" ", "_")
            d3.selectAll(`.ref-${catCleaned}`).style("opacity", 0)
            d3.selectAll(`.refText-${catCleaned}`).style("opacity", 0)
            d3.selectAll(`.refLink-${catCleaned}`).style("opacity", 0)
        })

        // add back those where at least one of the cats are active
        activeArray.forEach(cat => {
            let catCleaned = cat.replaceAll(" ", "_")
            d3.selectAll(`.ref-${catCleaned}`).style("opacity", 1)
            d3.selectAll(`.refText-${catCleaned}`).style("opacity", 1)
            d3.selectAll(`.refLink-${catCleaned}`).style("opacity", 1)
        })
    }
}
