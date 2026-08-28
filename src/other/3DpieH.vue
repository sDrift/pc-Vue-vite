<template>
  <div style="height: 100%; width: 100%">
    <!-- 注释掉不存在的图片引用 -->
    <!-- <img
      class="bcpic"
      src="@/assets/main/cyzc/hlwnpic/bc.png"
    > -->
    <div id="container" />
    <div class="tl">
      <div
        v-for="(item, index) in dataList"
        :key="item.name"
        class="tl-item"
      >
        <div
          class="icon"
          :style="{ background: color[index] }"
        />
        <span>{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>
<script>
import highcharts from "highcharts";

export default {
    props: {
        dataList: {
            type: Array,
            default: () => [
                {
                    name: "纺织新材料产业",
                    y: 186,
                    h: 0,
                    bfb: 0,
                },
                {
                    name: "电子信息产业",
                    y: 98,
                    h: 0,
                    bfb: 0,
                },
                {
                    name: "生物医药产业",
                    y: 46,
                    h: 0,
                    bfb: 0,
                },
                {
                    name: "其他产业",
                    y: 80,
                    h: 0,
                    bfb: 0,
                },
            ],
        },
        color: {
            type: Array,
            default: () => ["#E23AF5", "#6CCEE6", "#321AC3", "#1532CC"],
        },
    },
    created() {},
    mounted() {
        this.initChart();
    },
    methods: {
        initChart() {
            let quantity = 0; // 总数
            this.dataList.forEach((item) => {
                quantity += item.y;
            });
            this.dataList.forEach((item) => {
                item.bfb = ((item.y / quantity) * 100).toFixed(1);
                item.h = item.bfb * 1.5 >= 70 ? 70 : item.bfb * 1.5;
                // item.h = parseInt(0.86 * item.bfb); // 最高高度60，根据比例渲染高度
                // console.log(this.dataList, "dataList----->>>");
            });
            // 修改3d饼图绘制过程
            var round = Math.round,
                cos = Math.cos,
                sin = Math.sin,
                deg2rad = Math.deg2rad;
            highcharts.wrap(
                highcharts.seriesTypes.pie.prototype,
                "translate",
                function(proceed) {
                    proceed.apply(this, [].slice.call(arguments, 1));
                    // Do not do this if the chart is not 3D
                    if (!this.chart.is3d) {
                        return;
                    }
                    var series = this,
                        chart = series.chart,
                        options = chart.options,
                        seriesOptions = series.options,
                        depth = seriesOptions.depth || 0,
                        options3d = options.chart.options3d,
                        alpha = options3d.alpha,
                        beta = options3d.beta,
                        z = seriesOptions.stacking
                            ? (seriesOptions.stack || 0) * depth
                            : series._i * depth;
                    z += depth / 2;
                    console.log(depth);
                    if (seriesOptions.grouping !== false) {
                        z = 0;
                    }
                    series.data.forEach(function(point) {
                        var shapeArgs = point.shapeArgs,
                            angle;
                        point.shapeType = "arc3d";
                        // 为ran提供默认值以确保3D效果正常显示
                        var ran = point.options.h || 0;
                        shapeArgs.z = z;
                        shapeArgs.depth = depth * 0.25 + ran;
                        // console.log(111, depth, ran);
                        shapeArgs.alpha = alpha;
                        shapeArgs.beta = beta;
                        shapeArgs.center = series.center;
                        shapeArgs.ran = ran;
                        angle = (shapeArgs.end + shapeArgs.start) / 2;
                        point.slicedTranslation = {
                            translateX: round(
                                cos(angle) * seriesOptions.slicedOffset * cos(alpha * deg2rad)
                            ),
                            translateY: round(
                                sin(angle) * seriesOptions.slicedOffset * cos(alpha * deg2rad)
                            ),
                        };
                    });
                }
            );
            (function(H) {
                H.wrap(
                    highcharts.SVGRenderer.prototype,
                    "arc3dPath",
                    function(proceed) {
                        // Run original proceed method
                        var ret = proceed.apply(this, [].slice.call(arguments, 1));
                        ret.zTop = (ret.zOut + 0.5) / 100;
                        return ret;
                    }
                );
            })(highcharts);
            highcharts.chart("container", {
                chart: {
                    animation: false,
                    backgroundColor: "none",
                    type: "pie", //饼图
                    // margin: [30, 30, 30, 30],
                    options3d: {
                        enabled: true, //使用3d功能
                        alpha: 70, //延y轴向内的倾斜角度
                        beta: 0,
                    },
                    events: {
                        load: function() {
                            var points = this.series[0].points;
                            points.forEach(function(p) {
                                if (p.graphic) {
                                    p.graphic.attr({
                                        translateY: -p.shapeArgs.ran,
                                    });
                                    if (p.graphic.side1) {
                                        p.graphic.side1.attr({
                                            translateY: -p.shapeArgs.ran,
                                        });
                                    }
                                    if (p.graphic.side2) {
                                        p.graphic.side2.attr({
                                            translateY: -p.shapeArgs.ran,
                                        });
                                    }
                                }
                            });
                        },
                    },
                },
                legend: {
                    enabled: false, // 关闭图例
                    align: "center",
                    // x: -20,
                    // y: 0,
                    // symbolHeight: 14,
                    // symbolRadius: "0%", // 修改成圆
                    // itemMarginBottom: 13,
                    //   useHTML: true,
                    //labelFormat: '{name}&nbsp;&nbsp;&nbsp;&nbsp;{y}',
                    //   labelFormatter: function () {
                    //     return (
                    //       '<div style="width: .3125rem;display: inline-block">' +
                    //       this.name +
                    //       ':&nbsp;&nbsp;</div><div style="color: #00d7da;display: inline-block">' +
                    //       this.y +
                    //       "</div>"
                    //     );
                    //   },
                    floating: true,
                    // itemDistance: 60,
                    itemStyle: {
                        color: "#fff",
                        fontSize: "26px",
                        fontWeight: "nolmal",
                    },
                },
                title: {
                    // enabled: false,
                    text: "",
                },
                subtitle: {
                    text: "",
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: false, // 禁用点击
                        cursor: "pointer",
                        depth: 80,
                        showInLegend: false,
                        size: 230, // 外圈直径大小
                        innerSize: 0, // 内圈直径大小
                        center: ["48%", "45%"],
                        colors: ["#E23AF5", "#6CCEE6", "#321AC3", "#1532CC"],
                        dataLabels: {
                            useHTML: false,
                            enabled: true, //是否显示饼图的线形tip
                            distance: 1,
                            borderColor: "#007acc",
                            align: "right",
                            // verticalAlign: 'top',
                            // position: "center",
                            format: "{point.bfb}%",
                            // formatter: (point,b) => {
                            // },
                            color: "#fff",
                            style: {
                                textOutline: "none",
                                fontSize: 24,
                            },
                        },
                    },
                },
                tooltip: {
                    // show:false,
                    // fontSize: 40,
                    useHTML: true,
                    style: {
                        fontSize: 40,
                    },
                    formatter:function() {
                        console.log(this.point)
                        return `<span style="font-size: 30px;">${this.point.name}：${(this.point.bfb*1).toFixed(2)}%</span><br/>`
                    }
                },
                credits: {
                    enabled: false, // 禁用版权信息
                },
                series: [
                    {
                        type: "pie",
                        name: "数量",
                        depth: 120, // 设置饼图深度，增强3D效果
                        data: this.dataList,
                    },
                ],
            });
        },
    },
};
</script>

<style lang="scss" scoped>
#container {
    position: absolute;
    top: 22%;
  width: 100%;
  height: 100%;
}
.tl {
  font-size: 24px;
  position: absolute;
  top: 77px;
  right: 0px;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  color: #fff;

  > div {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 50%;

    &:nth-child(2) {
      padding-left: 15px;
    }

    &:nth-child(4) {
      padding-left: 15px;
    }
  }

  .icon {
    width: 14px;
    height: 14px;
    background: #fff;
    margin-right: 10px;
  }
}
.bcpic {
  width: 348px;
  position: absolute;
  left: 10%;
  top: 59%;
}
</style>
